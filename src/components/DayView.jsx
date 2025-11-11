import { useState, useRef, useCallback, useEffect } from "react";
import { format } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import TaskItem from "./TaskItem";
import TaskEditor from "./TaskEditor";
import "./DayView.css";

function DayView({
  date,
  scheduledTasks,
  onDeleteTask,
  onUpdateTask,
  onMoveToDraft,
  onToggleComplete,
  onResizeTask,
  taskTypes,
}) {
  const [editingTask, setEditingTask] = useState(null);
  // Start from 7 AM, display 24 hours: 7, 8, ..., 23, 0, 1, ..., 6
  const hours = Array.from({ length: 24 }, (_, i) => (i + 7) % 24);
  const START_HOUR = 7; // Timeline start hour
  const dateKey = format(date, "yyyy-MM-dd");
  // Only show tasks from day draft in day view timeline (not from week/month drafts)
  const allTasks = scheduledTasks[dateKey] || [];
  const tasks = allTasks.filter(
    (task) => !task.source || task.source === "day-draft"
  );

  // Calculate task position and height on timeline (starting from 7 AM)
  const getTaskStyle = (task) => {
    const startMinutes = task.startTime || 0;
    const duration = task.duration || 60;

    // Convert time to position relative to 7 AM
    // If task is before 7 AM (0-6), display at bottom of timeline
    let relativeMinutes = startMinutes - START_HOUR * 60;
    if (relativeMinutes < 0) {
      relativeMinutes += 24 * 60; // Handle day overflow
    }

    const topPercent = (relativeMinutes / (24 * 60)) * 100;
    const heightPercent = (duration / (24 * 60)) * 100;

    return {
      top: `${topPercent}%`,
      height: `${heightPercent}%`,
    };
  };

  const handleTaskClick = (task) => {
    setEditingTask(task);
  };

  const handleSaveTask = (updates) => {
    if (editingTask) {
      onUpdateTask(dateKey, editingTask.id, updates);
    }
  };

  // Wrapper for onResizeTask that also updates editingTask if it's being edited
  const handleResizeTask = (taskDateKey, taskId, newStartTime, newDuration) => {
    onResizeTask(taskDateKey, taskId, newStartTime, newDuration);
    // If this task is currently being edited, update editingTask with new time
    if (editingTask && editingTask.id === taskId) {
      setEditingTask({
        ...editingTask,
        startTime: newStartTime,
        duration: newDuration,
      });
    }
  };

  // Sync editingTask with latest task data from scheduledTasks
  useEffect(() => {
    if (editingTask) {
      const currentTask = tasks.find((t) => t.id === editingTask.id);
      if (currentTask) {
        // Only update if startTime or duration changed (to avoid unnecessary re-renders)
        if (
          currentTask.startTime !== editingTask.startTime ||
          currentTask.duration !== editingTask.duration ||
          currentTask.text !== editingTask.text ||
          currentTask.type !== editingTask.type
        ) {
          setEditingTask(currentTask);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks]);

  return (
    <div className="day-view">
      <h2 className="view-title">
        {format(date, "EEEE, MMMM d, yyyy", { locale: enUS })}
      </h2>
      <div className="day-view-container">
        <div className="time-labels">
          {hours.map((hour) => (
            <div key={hour} className="time-label-hour">
              {hour < 10 ? `0${hour}:00` : `${hour}:00`}
            </div>
          ))}
        </div>
        <div className="time-axis">
          {hours.map((hour, index) => {
            const taskKey = `${dateKey}-${hour}`;
            return (
              <TimeSlot
                key={`${hour}-${index}`}
                hour={hour}
                dateKey={dateKey}
                onDeleteTask={onDeleteTask}
                onMoveToDraft={onMoveToDraft}
                taskTypes={taskTypes}
              />
            );
          })}

          {/* Render tasks */}
          <div className="tasks-layer">
            {tasks.map((task) => (
              <DraggableScheduledTask
                key={task.id}
                task={task}
                dateKey={dateKey}
                style={getTaskStyle(task)}
                taskTypes={taskTypes}
                onTaskClick={handleTaskClick}
                onDeleteTask={onDeleteTask}
                onMoveToDraft={onMoveToDraft}
                onToggleComplete={onToggleComplete}
                onResizeTask={handleResizeTask}
                START_HOUR={START_HOUR}
              />
            ))}
          </div>
        </div>
      </div>

      {editingTask && (
        <TaskEditor
          task={editingTask}
          onSave={handleSaveTask}
          onClose={() => setEditingTask(null)}
          taskTypes={taskTypes}
        />
      )}
    </div>
  );
}

function DraggableScheduledTask({
  task,
  dateKey,
  style,
  taskTypes,
  onTaskClick,
  onDeleteTask,
  onMoveToDraft,
  onToggleComplete,
  onResizeTask,
  START_HOUR,
}) {
  const taskType =
    taskTypes.find((t) => t.id === task.type) ||
    taskTypes[taskTypes.length - 1];

  // Use unique ID including date and task ID to identify tasks dragged from timeline
  const dragId = `scheduled-task-${dateKey}-${task.id}`;
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: dragId,
      data: {
        type: "scheduled-task",
        task: task,
        dateKey: dateKey,
      },
    });

  const formatTime = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  // Resize handlers
  const resizeStartRef = useRef(null);
  const resizeTypeRef = useRef(null); // 'top' or 'bottom'
  const [isResizing, setIsResizing] = useState(false);
  const resizeMoveHandlerRef = useRef(null);
  const resizeEndHandlerRef = useRef(null);
  const accumulatedDeltaRef = useRef(0); // Track accumulated pixel movement
  const justFinishedResizingRef = useRef(false); // Track if we just finished resizing

  const handleResizeMove = useCallback(
    (e) => {
      if (!resizeStartRef.current || !resizeTypeRef.current) {
        return;
      }

      try {
        e.stopPropagation();
        e.preventDefault();

        const currentY = e.clientY;
        const lastY = resizeStartRef.current.lastY || resizeStartRef.current.y;
        const pixelDelta = currentY - lastY;

        // Accumulate small movements for smoother snapping
        accumulatedDeltaRef.current += pixelDelta;

        const timeAxisElement = document.querySelector(".time-axis");
        if (!timeAxisElement) {
          return;
        }

        const timeAxisHeight = timeAxisElement.offsetHeight || 1920; // 80px * 24 = 1920px
        // Use finer precision: each pixel represents less time
        // With 80px per hour: 1440 minutes / 1920px = 0.75 minutes per pixel
        const minutesPerPixel = (24 * 60) / timeAxisHeight;

        // Use 5-minute snap for better precision control
        const TIME_SNAP = 5; // Snap to 5-minute intervals
        const rawDeltaMinutes = accumulatedDeltaRef.current * minutesPerPixel;
        const snappedMinutes =
          Math.round(rawDeltaMinutes / TIME_SNAP) * TIME_SNAP;

        // Only update if there's a meaningful change (at least 5 minutes)
        if (Math.abs(snappedMinutes) < TIME_SNAP) {
          resizeStartRef.current.lastY = currentY;
          return;
        }

        // Apply the snapped change
        const deltaMinutes = snappedMinutes;
        accumulatedDeltaRef.current = 0; // Reset accumulation after applying

        if (resizeTypeRef.current === "top") {
          const newStartTime = Math.max(
            0,
            resizeStartRef.current.startTime + deltaMinutes
          );
          const newDuration = resizeStartRef.current.duration - deltaMinutes;
          if (newDuration >= 15 && onResizeTask) {
            onResizeTask(dateKey, task.id, newStartTime, newDuration);
            resizeStartRef.current.startTime = newStartTime;
            resizeStartRef.current.duration = newDuration;
            resizeStartRef.current.y = currentY;
            resizeStartRef.current.lastY = currentY;
          }
        } else if (resizeTypeRef.current === "bottom") {
          const newDuration = Math.max(
            15,
            resizeStartRef.current.duration + deltaMinutes
          );
          if (onResizeTask) {
            onResizeTask(
              dateKey,
              task.id,
              resizeStartRef.current.startTime,
              newDuration
            );
            resizeStartRef.current.duration = newDuration;
            resizeStartRef.current.y = currentY;
            resizeStartRef.current.lastY = currentY;
          }
        }
      } catch (error) {
        console.error("Error in handleResizeMove:", error);
        if (resizeEndHandlerRef.current) {
          resizeEndHandlerRef.current(e);
        }
      }
    },
    [dateKey, task.id, onResizeTask]
  );

  const handleResizeEnd = useCallback((e) => {
    if (!resizeStartRef.current && !resizeTypeRef.current) {
      return;
    }

    if (e) {
      e.stopPropagation();
      e.preventDefault();
      e.stopImmediatePropagation();
    }

    // Mark that we just finished resizing to prevent click events
    justFinishedResizingRef.current = true;
    setIsResizing(false);
    resizeStartRef.current = null;
    resizeTypeRef.current = null;

    if (resizeMoveHandlerRef.current) {
      document.removeEventListener(
        "mousemove",
        resizeMoveHandlerRef.current,
        true
      );
      document.removeEventListener(
        "pointermove",
        resizeMoveHandlerRef.current,
        true
      );
    }
    if (resizeEndHandlerRef.current) {
      document.removeEventListener(
        "mouseup",
        resizeEndHandlerRef.current,
        true
      );
      document.removeEventListener(
        "pointerup",
        resizeEndHandlerRef.current,
        true
      );
    }

    // Reset the flag after a short delay to allow click events again
    setTimeout(() => {
      justFinishedResizingRef.current = false;
      dragStartPosRef.current = null;
      hasDraggedRef.current = false;
    }, 100);
  }, []);

  resizeMoveHandlerRef.current = handleResizeMove;
  resizeEndHandlerRef.current = handleResizeEnd;

  const handleResizeStart = (e, type) => {
    e.stopPropagation();
    e.preventDefault();
    if (e.stopImmediatePropagation) {
      e.stopImmediatePropagation();
    }

    setIsResizing(true);
    resizeTypeRef.current = type;
    accumulatedDeltaRef.current = 0; // Reset accumulation
    resizeStartRef.current = {
      y: e.clientY,
      lastY: e.clientY,
      startTime: task.startTime,
      duration: task.duration,
    };

    const moveHandler = resizeMoveHandlerRef.current || handleResizeMove;
    const endHandler = resizeEndHandlerRef.current || handleResizeEnd;

    document.addEventListener("mousemove", moveHandler, true);
    document.addEventListener("mouseup", endHandler, true);
    document.addEventListener("pointermove", moveHandler, true);
    document.addEventListener("pointerup", endHandler, true);
  };

  const handleCheckboxChange = (e) => {
    e.stopPropagation();
    if (onToggleComplete) {
      onToggleComplete(dateKey, task.id, !task.completed);
    }
  };

  const dragStyle = {
    ...style,
    borderLeftColor: taskType.color,
    opacity: isDragging ? 0.5 : 1,
    transform:
      isResizing || !transform
        ? undefined
        : transform
        ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
        : undefined,
  };

  // Conditionally apply drag listeners only when not resizing
  const dragListeners = isResizing ? {} : listeners;

  // Handle click events, distinguish between click and drag
  const dragStartPosRef = useRef(null);
  const hasDraggedRef = useRef(false);

  const handlePointerDown = (e) => {
    // Don't handle if clicking on resize handle or action buttons
    if (
      e.target.closest(".task-resize-handle") ||
      e.target.closest(".task-block-actions")
    ) {
      return;
    }
    // Stop propagation to prevent triggering background time slot events
    e.stopPropagation();
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    hasDraggedRef.current = false;
    if (listeners?.onPointerDown) {
      listeners.onPointerDown(e);
    }
  };

  const handlePointerMove = (e) => {
    if (dragStartPosRef.current) {
      const moved =
        Math.abs(e.clientX - dragStartPosRef.current.x) > 5 ||
        Math.abs(e.clientY - dragStartPosRef.current.y) > 5;
      if (moved) {
        hasDraggedRef.current = true;
      }
    }
  };

  const handleMouseDown = (e) => {
    // If clicking on button or resize handle, don't handle
    if (
      e.target.closest(".task-block-actions") ||
      e.target.closest(".task-resize-handle")
    ) {
      return;
    }
    // Stop propagation to prevent triggering background time slot events
    e.stopPropagation();
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    hasDraggedRef.current = false;
  };

  const handleMouseUp = (e) => {
    // If clicking on button, don't handle
    if (e.target.closest(".task-block-actions")) {
      return;
    }
    // Don't trigger click if we're resizing or just finished resizing
    if (isResizing || justFinishedResizingRef.current) {
      return;
    }
    // Stop propagation to prevent triggering background time slot events
    e.stopPropagation();
    // Check if it's really just a click (no movement)
    if (dragStartPosRef.current && !hasDraggedRef.current) {
      const moved =
        Math.abs(e.clientX - dragStartPosRef.current.x) > 5 ||
        Math.abs(e.clientY - dragStartPosRef.current.y) > 5;
      if (!moved && !isDragging) {
        // Delay slightly to ensure drag event is processed
        setTimeout(() => {
          if (!isDragging && !isResizing && !justFinishedResizingRef.current) {
            onTaskClick(task);
          }
        }, 50);
      }
    }
    dragStartPosRef.current = null;
    hasDraggedRef.current = false;
  };

  // Wrap drag listeners to add stopPropagation and prevent accidental drags
  const wrappedDragListeners = {
    ...dragListeners,
    onPointerDown: (e) => {
      // Stop propagation first to prevent triggering background time slot drop events
      e.stopPropagation();
      // Call our custom handler first to track position
      handlePointerDown(e);
      // Then call drag listener (but activationConstraint in App.jsx will prevent accidental drags)
      if (dragListeners?.onPointerDown) {
        dragListeners.onPointerDown(e);
      }
    },
  };

  return (
    <div
      ref={setNodeRef}
      className={`scheduled-task-block ${task.completed ? "completed" : ""}`}
      style={dragStyle}
      {...attributes}
      {...wrappedDragListeners}
      onClick={(e) => {
        // Stop propagation to prevent triggering background time slot events
        e.stopPropagation();
        // Don't trigger click if we're resizing, dragging, or just finished resizing
        if (
          !hasDraggedRef.current &&
          !isDragging &&
          !isResizing &&
          !justFinishedResizingRef.current
        ) {
          onTaskClick(task);
        }
      }}
      onMouseDown={(e) => {
        // Stop propagation to prevent triggering background time slot drop events
        e.stopPropagation();
        handleMouseDown(e);
      }}
    >
      {/* Top resize handle */}
      <div
        className="task-resize-handle task-resize-handle-top"
        onMouseDown={(e) => {
          e.stopPropagation();
          if (e.stopImmediatePropagation) {
            e.stopImmediatePropagation();
          }
          handleResizeStart(e, "top");
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          if (e.stopImmediatePropagation) {
            e.stopImmediatePropagation();
          }
          handleResizeStart(e, "top");
        }}
        onClick={(e) => e.stopPropagation()}
        title="Drag to adjust start time"
      />
      <div className="task-block-checkbox-container">
        <input
          type="checkbox"
          className="task-block-checkbox"
          checked={task.completed || false}
          onChange={handleCheckboxChange}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          title={task.completed ? "Mark as incomplete" : "Mark as complete"}
        />
      </div>
      <div
        className="task-block-content"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        style={{ cursor: "grab" }}
      >
        <div
          className={`task-block-text ${
            task.completed ? "completed-text" : ""
          }`}
        >
          {task.text}
        </div>
        <div className="task-block-time">
          {formatTime(task.startTime)} -{" "}
          {formatTime(task.startTime + task.duration)}
        </div>
      </div>
      <div className="task-block-actions">
        <button
          className="task-block-action-btn"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onMoveToDraft(task);
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            e.stopImmediatePropagation();
            e.preventDefault();
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            if (e.stopImmediatePropagation) {
              e.stopImmediatePropagation();
            }
            e.preventDefault();
          }}
          title="Move to Draft"
        >
          ↶
        </button>
        <button
          className="task-block-action-btn delete"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onDeleteTask(dateKey, task.id);
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            e.stopImmediatePropagation();
            e.preventDefault();
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            if (e.stopImmediatePropagation) {
              e.stopImmediatePropagation();
            }
            e.preventDefault();
          }}
          title="Delete"
        >
          ×
        </button>
      </div>
      {/* Bottom resize handle */}
      <div
        className="task-resize-handle task-resize-handle-bottom"
        onMouseDown={(e) => {
          e.stopPropagation();
          if (e.stopImmediatePropagation) {
            e.stopImmediatePropagation();
          }
          handleResizeStart(e, "bottom");
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          if (e.stopImmediatePropagation) {
            e.stopImmediatePropagation();
          }
          handleResizeStart(e, "bottom");
        }}
        onClick={(e) => e.stopPropagation()}
        title="Drag to adjust duration"
      />
    </div>
  );
}

function TimeSlot({ hour, dateKey, onDeleteTask, onMoveToDraft, taskTypes }) {
  const taskKey = `${dateKey}-${hour}`;
  const { setNodeRef, isOver } = useDroppable({
    id: `time-slot-${taskKey}`,
  });

  return (
    <div ref={setNodeRef} className={`time-slot ${isOver ? "drag-over" : ""}`}>
      {isOver && <div className="drop-hint">Release to add task</div>}
    </div>
  );
}

export default DayView;
