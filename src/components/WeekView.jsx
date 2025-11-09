import { format, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import { useDroppable } from "@dnd-kit/core";
import TaskItem from "./TaskItem";
import "./WeekView.css";

function WeekView({
  weekStart,
  scheduledTasks,
  onDeleteTask,
  onUpdateTask,
  onMoveToDraft,
  taskTypes,
}) {
  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: endOfWeek(weekStart, { locale: enUS }),
  });

  // Start from 7 AM, display 24 hours: 7, 8, ..., 23, 0, 1, ..., 6
  const hours = Array.from({ length: 24 }, (_, i) => (i + 7) % 24);

  // Get tasks for a specific date and hour
  const getTasksForHour = (dateKey, hour) => {
    const allTasks = scheduledTasks[dateKey] || [];
    const hourStart = hour * 60;
    const hourEnd = (hour + 1) * 60;

    return allTasks.filter((task) => {
      const taskStart = task.startTime || 0;
      const taskEnd = taskStart + (task.duration || 60);
      // Task overlaps with this hour
      return taskStart < hourEnd && taskEnd > hourStart;
    });
  };

  return (
    <div className="week-view">
      <div className="week-header">
        <div className="week-header-placeholder"></div>
        {weekDays.map((day) => (
          <div key={day.toISOString()} className="week-day-header">
            <div className="day-name">
              {format(day, "EEE", { locale: enUS })}
            </div>
            <div className="day-date">{format(day, "MM/dd")}</div>
          </div>
        ))}
      </div>

      <div className="week-grid">
        {hours.map((hour, index) => (
          <div key={`${hour}-${index}`} className="week-hour-row">
            <div className="hour-label">
              {hour < 10 ? `0${hour}:00` : `${hour}:00`}
            </div>
            {weekDays.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const tasks = getTasksForHour(dateKey, hour);

              return (
                <WeekTimeSlot
                  key={`${dateKey}-${hour}-${index}`}
                  hour={hour}
                  dateKey={dateKey}
                  tasks={tasks}
                  onDeleteTask={onDeleteTask}
                  onMoveToDraft={onMoveToDraft}
                  taskTypes={taskTypes}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function WeekTimeSlot({
  hour,
  dateKey,
  tasks,
  onDeleteTask,
  onMoveToDraft,
  taskTypes,
}) {
  const taskKey = `${dateKey}-${hour}`;
  const { setNodeRef, isOver } = useDroppable({
    id: `time-slot-${taskKey}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={`week-time-slot ${isOver ? "drag-over" : ""}`}
    >
      {tasks.map((task) => {
        const taskType =
          taskTypes.find((t) => t.id === task.type) ||
          taskTypes[taskTypes.length - 1];
        return (
          <TaskItem
            key={task.id}
            task={task}
            color={taskType.color}
            onDelete={(id) => onDeleteTask(dateKey, id)}
            onMoveToDraft={() => onMoveToDraft(task)}
          />
        );
      })}
      {tasks.length === 0 && isOver && (
        <div className="drop-hint-small">Release</div>
      )}
    </div>
  );
}

export default WeekView;
