import { useState, useRef } from 'react'
import { format } from 'date-fns'
import { enUS } from 'date-fns/locale/en-US'
import { useDroppable, useDraggable } from '@dnd-kit/core'
import TaskItem from './TaskItem'
import TaskEditor from './TaskEditor'
import './DayView.css'

function DayView({ date, scheduledTasks, onDeleteTask, onUpdateTask, onMoveToDraft, taskTypes }) {
  const [editingTask, setEditingTask] = useState(null)
  // Start from 7 AM, display 24 hours: 7, 8, ..., 23, 0, 1, ..., 6
  const hours = Array.from({ length: 24 }, (_, i) => (i + 7) % 24)
  const START_HOUR = 7 // Timeline start hour
  const dateKey = format(date, 'yyyy-MM-dd')
  const tasks = scheduledTasks[dateKey] || []

  // Calculate task position and height on timeline (starting from 7 AM)
  const getTaskStyle = (task) => {
    const startMinutes = task.startTime || 0
    const duration = task.duration || 60
    
    // Convert time to position relative to 7 AM
    // If task is before 7 AM (0-6), display at bottom of timeline
    let relativeMinutes = startMinutes - (START_HOUR * 60)
    if (relativeMinutes < 0) {
      relativeMinutes += 24 * 60 // Handle day overflow
    }
    
    const topPercent = (relativeMinutes / (24 * 60)) * 100
    const heightPercent = (duration / (24 * 60)) * 100
    
    return {
      top: `${topPercent}%`,
      height: `${heightPercent}%`,
    }
  }

  const handleTaskClick = (task) => {
    setEditingTask(task)
  }

  const handleSaveTask = (updates) => {
    if (editingTask) {
      onUpdateTask(dateKey, editingTask.id, updates)
    }
  }

  return (
    <div className="day-view">
      <h2 className="view-title">{format(date, 'EEEE, MMMM d, yyyy', { locale: enUS })}</h2>
      <div className="day-view-container">
        <div className="time-labels">
          {hours.map(hour => (
            <div key={hour} className="time-label-hour">
              {hour < 10 ? `0${hour}:00` : `${hour}:00`}
            </div>
          ))}
        </div>
        <div className="time-axis">
          {hours.map((hour, index) => {
            const taskKey = `${dateKey}-${hour}`
            return (
              <TimeSlot
                key={`${hour}-${index}`}
                hour={hour}
                dateKey={dateKey}
                onDeleteTask={onDeleteTask}
                onMoveToDraft={onMoveToDraft}
                taskTypes={taskTypes}
              />
            )
          })}
          
          {/* Render tasks */}
          <div className="tasks-layer">
            {tasks.map(task => (
              <DraggableScheduledTask
                key={task.id}
                task={task}
                dateKey={dateKey}
                style={getTaskStyle(task)}
                taskTypes={taskTypes}
                onTaskClick={handleTaskClick}
                onDeleteTask={onDeleteTask}
                onMoveToDraft={onMoveToDraft}
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
        />
      )}
    </div>
  )
}

function DraggableScheduledTask({ task, dateKey, style, taskTypes, onTaskClick, onDeleteTask, onMoveToDraft }) {
  const taskType = taskTypes.find(t => t.id === task.type) || taskTypes[taskTypes.length - 1]
  
  // Use unique ID including date and task ID to identify tasks dragged from timeline
  const dragId = `scheduled-task-${dateKey}-${task.id}`
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: dragId,
    data: {
      type: 'scheduled-task',
      task: task,
      dateKey: dateKey,
    },
  })

  const formatTime = (minutes) => {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
  }

  const dragStyle = {
    ...style,
    borderLeftColor: taskType.color,
    opacity: isDragging ? 0.5 : 1,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
  }

  // Handle click events, distinguish between click and drag
  const dragStartPosRef = useRef(null)
  const hasDraggedRef = useRef(false)
  
  const handlePointerDown = (e) => {
    dragStartPosRef.current = { x: e.clientX, y: e.clientY }
    hasDraggedRef.current = false
    if (listeners?.onPointerDown) {
      listeners.onPointerDown(e)
    }
  }

  const handlePointerMove = (e) => {
    if (dragStartPosRef.current) {
      const moved = Math.abs(e.clientX - dragStartPosRef.current.x) > 5 || 
                    Math.abs(e.clientY - dragStartPosRef.current.y) > 5
      if (moved) {
        hasDraggedRef.current = true
      }
    }
  }

  const handleMouseDown = (e) => {
    // If clicking on button, don't handle
    if (e.target.closest('.task-block-actions')) {
      return
    }
    dragStartPosRef.current = { x: e.clientX, y: e.clientY }
    hasDraggedRef.current = false
  }

  const handleMouseUp = (e) => {
    // If clicking on button, don't handle
    if (e.target.closest('.task-block-actions')) {
      return
    }
    // Check if it's really just a click (no movement)
    if (dragStartPosRef.current && !hasDraggedRef.current) {
      const moved = Math.abs(e.clientX - dragStartPosRef.current.x) > 5 || 
                    Math.abs(e.clientY - dragStartPosRef.current.y) > 5
      if (!moved && !isDragging) {
        // Delay slightly to ensure drag event is processed
        setTimeout(() => {
          if (!isDragging) {
            onTaskClick(task)
          }
        }, 50)
      }
    }
    dragStartPosRef.current = null
    hasDraggedRef.current = false
  }

  return (
    <div
      ref={setNodeRef}
      className="scheduled-task-block"
      style={dragStyle}
      {...attributes}
    >
      <div 
        className="task-block-content" 
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        style={{ cursor: 'grab' }}
      >
        <div className="task-block-text">{task.text}</div>
        <div className="task-block-time">
          {formatTime(task.startTime)} - {formatTime(task.startTime + task.duration)}
        </div>
      </div>
      <div className="task-block-actions">
        <button
          className="task-block-action-btn"
          onClick={(e) => {
            e.stopPropagation();
            onMoveToDraft(task);
          }}
          title="Move to Draft"
        >
          ↶
        </button>
        <button
          className="task-block-action-btn delete"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteTask(dateKey, task.id);
          }}
          title="Delete"
        >
          ×
        </button>
      </div>
    </div>
  )
}

function TimeSlot({ hour, dateKey, onDeleteTask, onMoveToDraft, taskTypes }) {
  const taskKey = `${dateKey}-${hour}`
  const { setNodeRef, isOver } = useDroppable({
    id: `time-slot-${taskKey}`,
  })

  return (
    <div 
      ref={setNodeRef}
      className={`time-slot ${isOver ? 'drag-over' : ''}`}
    >
      {isOver && (
        <div className="drop-hint">Release to add task</div>
      )}
    </div>
  )
}

export default DayView
