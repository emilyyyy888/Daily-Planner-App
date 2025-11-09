import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { startOfWeek, format } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import Header from "./components/Header";
import DraftPanel from "./components/DraftPanel";
import DayView from "./components/DayView";
import WeekView from "./components/WeekView";
import MonthView from "./components/MonthView";
import "./App.css";

const TASK_TYPES = [
  { id: "work", name: "Work", color: "var(--work-color)" },
  { id: "study", name: "Study", color: "var(--study-color)" },
  { id: "exercise", name: "Exercise", color: "var(--exercise-color)" },
  { id: "rest", name: "Rest", color: "var(--rest-color)" },
  { id: "other", name: "Other", color: "var(--other-color)" },
];

function App() {
  const [view, setView] = useState("day"); // 'day', 'week', 'month'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [draftTasks, setDraftTasks] = useState([]);
  const [scheduledTasks, setScheduledTasks] = useState({}); // { date: [tasks] } Each task contains startTime(minutes) and duration(minutes)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load data from localStorage
  useEffect(() => {
    const savedDrafts = localStorage.getItem("draftTasks");
    const savedScheduled = localStorage.getItem("scheduledTasks");

    if (savedDrafts) {
      setDraftTasks(JSON.parse(savedDrafts));
    }
    if (savedScheduled) {
      const data = JSON.parse(savedScheduled);

      // Data migration: Convert old format { date-hour: [tasks] } to new format { date: [tasks] }
      const migratedData = {};

      Object.keys(data).forEach((key) => {
        const tasks = data[key];

        // Check if it's old format (contains - and last part is a number)
        if (key.includes("-")) {
          const parts = key.split("-");
          const lastPart = parts[parts.length - 1];

          if (
            !isNaN(parseInt(lastPart)) &&
            parseInt(lastPart) >= 0 &&
            parseInt(lastPart) < 24
          ) {
            // This is old format: date-hour
            const hour = parseInt(lastPart);
            const date = parts.slice(0, -1).join("-");

            if (!migratedData[date]) {
              migratedData[date] = [];
            }

            // Migrate tasks, add startTime and duration
            tasks.forEach((task) => {
              migratedData[date].push({
                ...task,
                startTime: (task.hour !== undefined ? task.hour : hour) * 60,
                duration: task.duration || 60,
              });
            });
          } else {
            // New format or unrecognized format, use directly
            migratedData[key] = tasks.map((task) => ({
              ...task,
              startTime:
                task.startTime !== undefined
                  ? task.startTime
                  : (task.hour || 0) * 60,
              duration: task.duration || 60,
            }));
          }
        } else {
          // New format, use directly but ensure startTime and duration exist
          migratedData[key] = tasks.map((task) => ({
            ...task,
            startTime:
              task.startTime !== undefined
                ? task.startTime
                : (task.hour || 0) * 60,
            duration: task.duration || 60,
          }));
        }
      });

      setScheduledTasks(migratedData);
      // Save migrated data
      localStorage.setItem("scheduledTasks", JSON.stringify(migratedData));
    }
  }, []);

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem("draftTasks", JSON.stringify(draftTasks));
  }, [draftTasks]);

  useEffect(() => {
    localStorage.setItem("scheduledTasks", JSON.stringify(scheduledTasks));
  }, [scheduledTasks]);

  const addDraftTask = (text, type = "other", id = null) => {
    const newTask = {
      id: id || Date.now().toString(),
      text,
      type,
      createdAt: new Date().toISOString(),
    };
    setDraftTasks([...draftTasks, newTask]);
  };

  const updateDraftTask = (id, updates) => {
    // Draft tasks currently don't support time info, but keep interface for future expansion
    setDraftTasks(
      draftTasks.map((task) =>
        task.id === id ? { ...task, ...updates } : task
      )
    );
  };

  const deleteDraftTask = (id) => {
    setDraftTasks(draftTasks.filter((task) => task.id !== id));
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    // If dragging to time slot
    if (overId.startsWith("time-slot-")) {
      // overId format: time-slot-yyyy-MM-dd-hour
      const parts = overId.replace("time-slot-", "").split("-");
      const hour = parseInt(parts[parts.length - 1]); // Last part is the hour
      const date = parts.slice(0, -1).join("-"); // Previous parts form the date

      // Check if dragged from draft or from timeline
      if (activeId.startsWith("scheduled-task-")) {
        // Dragging from timeline to timeline - move scheduled task
        // activeId format: scheduled-task-yyyy-MM-dd-taskId
        const withoutPrefix = activeId.replace("scheduled-task-", "");
        // Date format is yyyy-MM-dd (10 characters + 2 hyphens = 12 characters)
        // Find the first possible date end position (after 10th character)
        const oldDate = withoutPrefix.substring(0, 10); // yyyy-MM-dd
        const taskId = withoutPrefix.substring(11); // Skip hyphen, get taskId

        // Find task
        const oldTasks = scheduledTasks[oldDate] || [];
        const task = oldTasks.find((t) => t.id === taskId);

        if (task) {
          // If dragging to different date, need to move task
          if (oldDate !== date) {
            // Remove from old date
            setScheduledTasks((prev) => ({
              ...prev,
              [oldDate]: prev[oldDate].filter((t) => t.id !== taskId),
              [date]: [
                ...(prev[date] || []),
                { ...task, startTime: hour * 60 },
              ],
            }));
          } else {
            // Moving within same day, only update start time
            setScheduledTasks((prev) => ({
              ...prev,
              [date]: prev[date].map((t) =>
                t.id === taskId ? { ...t, startTime: hour * 60 } : t
              ),
            }));
          }
        }
      } else {
        // Dragging from draft to timeline
        const task = draftTasks.find((t) => t.id === activeId);
        if (task) {
          setDraftTasks(draftTasks.filter((t) => t.id !== activeId));

          // Add to schedule, use saved duration from draft task (if exists), otherwise default 1 hour
          const newTask = {
            ...task,
            id: `${task.id}-${Date.now()}`,
            date,
            startTime: hour * 60, // Convert to minutes
            duration: task.duration || 60, // Use saved duration, default 60 minutes
          };

          setScheduledTasks((prev) => ({
            ...prev,
            [date]: [...(prev[date] || []), newTask],
          }));
        }
      }
    }

    // If dragging to draft list
    if (overId === "draft-list") {
      // Check if dragged from timeline
      if (activeId.startsWith("scheduled-task-")) {
        // Dragging from timeline to draft
        const withoutPrefix = activeId.replace("scheduled-task-", "");
        const oldDate = withoutPrefix.substring(0, 10); // yyyy-MM-dd
        const taskId = withoutPrefix.substring(11); // Skip hyphen, get taskId

        // Find task
        const oldTasks = scheduledTasks[oldDate] || [];
        const task = oldTasks.find((t) => t.id === taskId);

        if (task) {
          // Remove from schedule
          setScheduledTasks((prev) => ({
            ...prev,
            [oldDate]: prev[oldDate].filter((t) => t.id !== taskId),
          }));

          // Add to draft, remove time information
          // If task ID contains timestamp (format: originalId-timestamp), extract original ID
          let originalId = task.id;
          const idParts = task.id.split("-");
          if (
            idParts.length > 1 &&
            !isNaN(parseInt(idParts[idParts.length - 1]))
          ) {
            // Last part is timestamp, remove it
            originalId = idParts.slice(0, -1).join("-");
          }

          const draftTask = {
            id: originalId,
            text: task.text,
            type: task.type,
            createdAt: task.createdAt || new Date().toISOString(),
          };

          setDraftTasks((prev) => [...prev, draftTask]);
        }
      }
    }

    // If reordering within draft panel
    if (
      activeId !== overId &&
      !overId.startsWith("time-slot-") &&
      overId !== "draft-list"
    ) {
      const oldIndex = draftTasks.findIndex((t) => t.id === activeId);
      const newIndex = draftTasks.findIndex((t) => t.id === overId);

      if (oldIndex !== -1 && newIndex !== -1) {
        setDraftTasks(arrayMove(draftTasks, oldIndex, newIndex));
      }
    }
  };

  // Calculate next available time slot
  const getNextAvailableTime = (date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    const tasks = scheduledTasks[dateKey] || [];
    const START_HOUR = 7; // Start from 7 AM
    const END_HOUR = 31; // Until next day 7 AM (7 + 24)

    // Create array to track occupancy of each time slot (in 15-minute units)
    const timeSlots = Array(END_HOUR * 4).fill(false); // 24 hours * 4 = 96 fifteen-minute slots

    // Mark occupied time slots
    tasks.forEach((task) => {
      const startSlot = Math.floor((task.startTime || 0) / 15);
      const durationSlots = Math.ceil((task.duration || 60) / 15);
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

    // Find first available time slot (at least 1 hour, i.e., 4 fifteen-minute slots)
    for (let i = START_HOUR * 4; i < timeSlots.length - 4; i++) {
      if (
        !timeSlots[i] &&
        !timeSlots[i + 1] &&
        !timeSlots[i + 2] &&
        !timeSlots[i + 3]
      ) {
        return i * 15; // Return minutes
      }
    }

    // If not found, return default time (7 AM)
    return START_HOUR * 60;
  };

  // Add task to schedule (from draft)
  const addTaskToSchedule = (task, date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    const startTime =
      task.startTime !== undefined
        ? task.startTime
        : getNextAvailableTime(date);
    const duration = task.duration || 60;

    const newTask = {
      ...task,
      id: `${task.id}-${Date.now()}`,
      date: dateKey,
      startTime: startTime,
      duration: duration,
    };

    setScheduledTasks((prev) => ({
      ...prev,
      [dateKey]: [...(prev[dateKey] || []), newTask],
    }));

    // Remove from draft
    setDraftTasks(draftTasks.filter((t) => t.id !== task.id));
  };

  const deleteScheduledTask = (date, taskId) => {
    setScheduledTasks((prev) => ({
      ...prev,
      [date]: (prev[date] || []).filter((t) => t.id !== taskId),
    }));
  };

  const updateScheduledTask = (date, taskId, updates) => {
    setScheduledTasks((prev) => ({
      ...prev,
      [date]: (prev[date] || []).map((t) =>
        t.id === taskId ? { ...t, ...updates } : t
      ),
    }));
  };

  const moveTaskToDraft = (task) => {
    const { date, startTime, duration, ...taskWithoutSchedule } = task;
    const newTask = {
      ...taskWithoutSchedule,
      id: Date.now().toString(),
    };
    setDraftTasks([...draftTasks, newTask]);
    deleteScheduledTask(date, task.id);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="app">
        <Header
          view={view}
          setView={setView}
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
        />

        <div className="app-content">
          <DraftPanel
            tasks={draftTasks}
            onAddTask={addDraftTask}
            onDeleteTask={deleteDraftTask}
            onUpdateTask={updateDraftTask}
            onAddToSchedule={addTaskToSchedule}
            currentDate={currentDate}
            scheduledTasks={scheduledTasks}
            taskTypes={TASK_TYPES}
          />

          <div className="schedule-view">
            {view === "day" && (
              <DayView
                date={currentDate}
                scheduledTasks={scheduledTasks}
                onDeleteTask={deleteScheduledTask}
                onUpdateTask={updateScheduledTask}
                onMoveToDraft={moveTaskToDraft}
                taskTypes={TASK_TYPES}
              />
            )}
            {view === "week" && (
              <WeekView
                weekStart={startOfWeek(currentDate, { locale: enUS })}
                scheduledTasks={scheduledTasks}
                onDeleteTask={deleteScheduledTask}
                onUpdateTask={updateScheduledTask}
                onMoveToDraft={moveTaskToDraft}
                taskTypes={TASK_TYPES}
              />
            )}
            {view === "month" && (
              <MonthView
                month={currentDate}
                scheduledTasks={scheduledTasks}
                onDeleteTask={deleteScheduledTask}
                onUpdateTask={updateScheduledTask}
                onMoveToDraft={moveTaskToDraft}
                taskTypes={TASK_TYPES}
              />
            )}
          </div>
        </div>
      </div>
    </DndContext>
  );
}

export default App;
