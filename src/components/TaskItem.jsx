import { useRef } from 'react'
import './TaskItem.css'

function TaskItem({ task, color, onDelete, onMoveToDraft, onEdit, isDraggable = false, dragListeners }) {
  const dragStartPosRef = useRef(null)
  const hasDraggedRef = useRef(false)

  const handlePointerDown = (e) => {
    // Don't handle if clicking on action buttons
    if (e.target.closest('.task-actions')) {
      return;
    }
    dragStartPosRef.current = { x: e.clientX, y: e.clientY }
    hasDraggedRef.current = false
    // Call drag listener if it exists
    if (dragListeners?.onPointerDown) {
      dragListeners.onPointerDown(e)
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
    // Call drag listener if it exists
    if (dragListeners?.onPointerMove) {
      dragListeners.onPointerMove(e)
    }
  }

  const handlePointerUp = (e) => {
    // Don't handle if clicking on action buttons
    if (e.target.closest('.task-actions')) {
      return;
    }
    // Check if it's really just a click (no movement)
    if (dragStartPosRef.current && !hasDraggedRef.current && onEdit) {
      const moved = Math.abs(e.clientX - dragStartPosRef.current.x) > 5 || 
                    Math.abs(e.clientY - dragStartPosRef.current.y) > 5
      if (!moved) {
        // Delay slightly to ensure drag event is processed
        setTimeout(() => {
          if (!hasDraggedRef.current && onEdit) {
            onEdit(task)
          }
        }, 50)
      }
    }
    dragStartPosRef.current = null
    hasDraggedRef.current = false
    // Call drag listener if it exists
    if (dragListeners?.onPointerUp) {
      dragListeners.onPointerUp(e)
    }
  }

  return (
    <div 
      className={`task-item ${isDraggable ? 'draggable' : ''}`}
      style={{ borderLeftColor: color }}
    >
      <div 
        className="task-content" 
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ cursor: onEdit ? 'pointer' : (isDraggable ? 'grab' : 'default') }}
      >
        <span className="task-text">{task.text}</span>
      </div>
      <div className="task-actions">
        {onMoveToDraft && (
          <button 
            className="task-action-btn"
            onPointerDown={(e) => {
              e.stopPropagation()
            }}
            onMouseDown={(e) => {
              e.stopPropagation()
            }}
            onClick={(e) => {
              e.stopPropagation()
              onMoveToDraft(task)
            }}
            title="Move to Draft"
          >
            ↶
          </button>
        )}
        {onEdit && (
          <button 
            className="task-action-btn edit"
            onPointerDown={(e) => {
              e.stopPropagation()
            }}
            onMouseDown={(e) => {
              e.stopPropagation()
            }}
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              onEdit(task)
            }}
            title="Edit"
          >
            ✎
          </button>
        )}
        {onDelete && (
          <button 
            className="task-action-btn delete"
            onPointerDown={(e) => {
              e.stopPropagation()
            }}
            onMouseDown={(e) => {
              e.stopPropagation()
            }}
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              // Call onDelete, which may accept event or id
              if (typeof onDelete === 'function') {
                onDelete(task.id, e)
              }
            }}
            title="Delete"
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}

export default TaskItem
