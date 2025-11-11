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
  weekDraftTasks = [],
  taskTypes,
}) {
  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: endOfWeek(weekStart, { locale: enUS }),
  });

  return (
    <div className="week-view">
      <div className="week-header">
        {weekDays.map((day) => (
          <div key={day.toISOString()} className="week-day-header">
            <div className="day-name">
              {format(day, "EEE", { locale: enUS })}
            </div>
            <div className="day-date">{format(day, "MM/dd")}</div>
          </div>
        ))}
      </div>

      <div className="week-grid-simple">
        {weekDays.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          // Only show tasks from week/month drafts in week view (not from day drafts)
          const allTasks = scheduledTasks[dateKey] || [];
          const tasks = allTasks.filter(
            (task) => !task.source || task.source !== "day-draft"
          );
          return (
            <WeekDayCell
              key={dateKey}
              date={day}
              dateKey={dateKey}
              tasks={tasks}
              onDeleteTask={onDeleteTask}
              onMoveToDraft={onMoveToDraft}
              taskTypes={taskTypes}
            />
          );
        })}
      </div>
    </div>
  );
}

function WeekDayCell({
  date,
  dateKey,
  tasks,
  onDeleteTask,
  onMoveToDraft,
  taskTypes,
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-cell-${dateKey}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={`week-day-cell ${isOver ? "drag-over" : ""}`}
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
        <div className="drop-hint-small">Drop task here</div>
      )}
    </div>
  );
}

export default WeekView;
