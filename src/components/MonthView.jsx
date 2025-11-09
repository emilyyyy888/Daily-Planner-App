import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay } from 'date-fns'
import { enUS } from 'date-fns/locale/en-US'
import { useDroppable } from '@dnd-kit/core'
import TaskItem from './TaskItem'
import './MonthView.css'

function MonthView({ month, scheduledTasks, onDeleteTask, onUpdateTask, onMoveToDraft, taskTypes }) {
  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)
  const calendarStart = startOfWeek(monthStart, { locale: enUS })
  const calendarEnd = endOfWeek(monthEnd, { locale: enUS })
  
  const days = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  })

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="month-view">
      <h2 className="view-title">{format(month, 'MMMM yyyy', { locale: enUS })}</h2>
      
      <div className="month-grid">
        {weekDays.map(day => (
          <div key={day} className="month-day-header">
            {day}
          </div>
        ))}
        
        {days.map(day => {
          const dateKey = format(day, 'yyyy-MM-dd')
          const dayTasks = scheduledTasks[dateKey] || []
          
          return (
            <MonthDayCell
              key={dateKey}
              day={day}
              dateKey={dateKey}
              isCurrentMonth={isSameMonth(day, month)}
              isToday={isSameDay(day, new Date())}
              tasks={dayTasks}
              onDeleteTask={onDeleteTask}
              onMoveToDraft={onMoveToDraft}
              taskTypes={taskTypes}
            />
          )
        })}
      </div>
    </div>
  )
}

function MonthDayCell({ day, dateKey, isCurrentMonth, isToday, tasks, onDeleteTask, onMoveToDraft, taskTypes }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `time-slot-${dateKey}-0`, // Default to 0:00
  })

  // Sort tasks by start time
  const sortedTasks = [...tasks].sort((a, b) => (a.startTime || 0) - (b.startTime || 0))

  return (
    <div
      ref={setNodeRef}
      className={`month-day-cell ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isOver ? 'drag-over' : ''}`}
    >
      <div className="day-number">{format(day, 'd')}</div>
      <div className="day-tasks">
        {sortedTasks.slice(0, 3).map(task => {
          const taskType = taskTypes.find(t => t.id === task.type) || taskTypes[taskTypes.length - 1]
          return (
            <div
              key={task.id}
              className="month-task-item"
              style={{ backgroundColor: taskType.color }}
            >
              <span className="month-task-text">{task.text}</span>
            </div>
          )
        })}
        {sortedTasks.length > 3 && (
          <div className="more-tasks">+{sortedTasks.length - 3} more</div>
        )}
        {sortedTasks.length === 0 && isOver && (
          <div className="drop-hint-month">Release to add</div>
        )}
      </div>
    </div>
  )
}

export default MonthView
