import { useState } from "react";
import { format } from "date-fns";
import { useSortable } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import TaskItem from "./TaskItem";
import TaskEditor from "./TaskEditor";
import "./DraftPanel.css";

function DraftPanel({
  tasks,
  onAddTask,
  onDeleteTask,
  onUpdateTask,
  onAddToSchedule,
  currentDate,
  scheduledTasks,
  taskTypes,
  view = "day",
}) {
  const [inputText, setInputText] = useState("");
  const [selectedType, setSelectedType] = useState("other");
  const [editingTask, setEditingTask] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputText.trim()) {
      // Create task without auto-opening editor
      onAddTask(inputText.trim(), selectedType);
      setInputText("");
    }
  };

  const handleSaveDraftTask = (updates) => {
    if (editingTask) {
      // Update draft task information (including task type)
      onUpdateTask(editingTask.id, updates);
      setEditingTask(null);
    }
  };

  const handleEditTask = (task) => {
    const taskType =
      taskTypes.find((t) => t.id === task.type) ||
      taskTypes[taskTypes.length - 1];
    setEditingTask({
      ...task,
      typeName: taskType.name,
      typeColor: taskType.color,
    });
  };

  return (
    <div className="draft-panel">
      <div className="draft-header">
        <h2>
          📝 {view === "day" ? "Day" : view === "week" ? "Week" : "Month"} Task Drafts
        </h2>
        <div className="task-type-selector">
          {taskTypes.map((type) => (
            <button
              key={type.id}
              className={`type-btn ${selectedType === type.id ? "active" : ""}`}
              onClick={() => setSelectedType(type.id)}
              style={{
                backgroundColor:
                  selectedType === type.id ? type.color : "transparent",
              }}
            >
              {type.name}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="draft-input-form">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Enter a task you want to complete..."
          className="draft-input"
        />
        <button type="submit" className="add-btn">
          +
        </button>
      </form>

      <DraftListDroppable>
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <SortableDraftTask
              key={task.id}
              task={task}
              onDelete={onDeleteTask}
              onEdit={handleEditTask}
              onAddToSchedule={onAddToSchedule}
              currentDate={currentDate}
              scheduledTasks={scheduledTasks}
              taskTypes={taskTypes}
              view={view}
            />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="empty-state">
            <p>✨ Write down your ideas here～</p>
          </div>
        )}
      </DraftListDroppable>

      {editingTask && (
        <TaskEditor
          task={editingTask}
          onSave={handleSaveDraftTask}
          onClose={() => setEditingTask(null)}
          isDraft={true}
          taskTypes={taskTypes}
        />
      )}
    </div>
  );
}

function SortableDraftTask({
  task,
  onDelete,
  onEdit,
  onAddToSchedule,
  currentDate,
  scheduledTasks,
  taskTypes,
  view = "day",
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const taskType =
    taskTypes.find((t) => t.id === task.type) ||
    taskTypes[taskTypes.length - 1];

  const handleDelete = (taskId, e) => {
    if (e) {
      e.stopPropagation(); // Prevent event bubbling to avoid triggering drag
    }
    onDelete(taskId);
  };

  // Calculate display time
  const getDisplayTime = () => {
    if (task.startTime !== undefined && task.duration !== undefined) {
      // User has edited time, show edited time
      const startMinutes = task.startTime;
      const endMinutes = startMinutes + task.duration;
      const startHour = Math.floor(startMinutes / 60);
      const startMin = startMinutes % 60;
      const endHour = Math.floor(endMinutes / 60);
      const endMin = endMinutes % 60;
      return `${startHour.toString().padStart(2, "0")}:${startMin
        .toString()
        .padStart(2, "0")} - ${endHour.toString().padStart(2, "0")}:${endMin
        .toString()
        .padStart(2, "0")}`;
    } else {
      // Calculate next available time
      const dateKey = format(currentDate, "yyyy-MM-dd");
      const tasks = scheduledTasks[dateKey] || [];
      const START_HOUR = 7;
      const END_HOUR = 31;

      const timeSlots = Array(END_HOUR * 4).fill(false);
      tasks.forEach((t) => {
        const startSlot = Math.floor((t.startTime || 0) / 15);
        const durationSlots = Math.ceil((t.duration || 60) / 15);
        for (
          let i = startSlot;
          i < Math.min(startSlot + durationSlots, timeSlots.length);
          i++
        ) {
          if (i >= 0 && i < timeSlots.length) {
            timeSlots[i] = true;
          }
        }
      });

      const defaultDuration = task.duration || 60;
      const durationSlots = Math.ceil(defaultDuration / 15);

      for (let i = START_HOUR * 4; i < timeSlots.length - durationSlots; i++) {
        let available = true;
        for (let j = 0; j < durationSlots; j++) {
          if (timeSlots[i + j]) {
            available = false;
            break;
          }
        }
        if (available) {
          const startMinutes = i * 15;
          const endMinutes = startMinutes + defaultDuration;
          const startHour = Math.floor(startMinutes / 60);
          const startMin = startMinutes % 60;
          const endHour = Math.floor(endMinutes / 60);
          const endMin = endMinutes % 60;
          return `${startHour.toString().padStart(2, "0")}:${startMin
            .toString()
            .padStart(2, "0")} - ${endHour.toString().padStart(2, "0")}:${endMin
            .toString()
            .padStart(2, "0")}`;
        }
      }

      // Default to 7:00 AM
      return `07:00 - ${Math.floor((7 * 60 + defaultDuration) / 60)
        .toString()
        .padStart(2, "0")}:${((7 * 60 + defaultDuration) % 60)
        .toString()
        .padStart(2, "0")}`;
    }
  };

  const handleAddToSchedule = (e) => {
    e.stopPropagation();
    if (onAddToSchedule) {
      onAddToSchedule(task, currentDate);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="draft-task-wrapper"
    >
      <TaskItem
        task={task}
        color={taskType.color}
        onDelete={handleDelete}
        onEdit={onEdit}
        isDraggable={true}
        dragListeners={listeners}
      />
      {/* Only show time and add button for day view */}
      {view === "day" && (
        <div className="draft-task-footer">
          <span className="draft-task-time">{getDisplayTime()}</span>
          <button
            className="draft-task-add-btn"
            onClick={handleAddToSchedule}
            title="Add to Schedule"
          >
            ➜
          </button>
        </div>
      )}
    </div>
  );
}

function DraftListDroppable({ children }) {
  const { setNodeRef, isOver } = useDroppable({
    id: "draft-list",
  });

  return (
    <div ref={setNodeRef} className={`draft-list ${isOver ? "drag-over" : ""}`}>
      {isOver && (
        <div className="drop-hint-draft">Release to move back to drafts</div>
      )}
      {children}
    </div>
  );
}

export default DraftPanel;
