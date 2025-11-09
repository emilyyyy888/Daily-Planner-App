import './TaskItem.css'

function TaskItem({ task, color, onDelete, onMoveToDraft, onEdit, isDraggable = false, dragListeners }) {
  return (
    <div 
      className={`task-item ${isDraggable ? 'draggable' : ''}`}
      style={{ borderLeftColor: color }}
    >
      <div className="task-content" {...dragListeners}>
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
