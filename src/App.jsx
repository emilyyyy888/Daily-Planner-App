import { useState, useEffect, useRef } from "react";
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
import {
  loadDraftTasks as loadDraftTasksSupabase,
  loadScheduledTasks as loadScheduledTasksSupabase,
  saveDraftTasks as saveDraftTasksSupabase,
  saveScheduledTasks as saveScheduledTasksSupabase,
  subscribeToDraftTasks as subscribeToDraftTasksSupabase,
  subscribeToScheduledTasks as subscribeToScheduledTasksSupabase,
} from "./utils/supabaseStorage";
import {
  loadDraftTasks as loadDraftTasksFirebase,
  loadScheduledTasks as loadScheduledTasksFirebase,
  saveDraftTasks as saveDraftTasksFirebase,
  saveScheduledTasks as saveScheduledTasksFirebase,
  subscribeToDraftTasks as subscribeToDraftTasksFirebase,
  subscribeToScheduledTasks as subscribeToScheduledTasksFirebase,
} from "./utils/firebaseStorage";
import "./App.css";

const TASK_TYPES = [
  { id: "work", name: "Work", color: "var(--work-color)" },
  { id: "study", name: "Study", color: "var(--study-color)" },
  { id: "class", name: "Class", color: "var(--class-color)" },
  { id: "rest", name: "Rest", color: "var(--rest-color)" },
  { id: "other", name: "Other", color: "var(--other-color)" },
];

function App() {
  const [view, setView] = useState("day"); // 'day', 'week', 'month'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dayDraftTasks, setDayDraftTasks] = useState({}); // { date: [tasks] } - organized by date
  const [weekDraftTasks, setWeekDraftTasks] = useState([]);
  const [monthDraftTasks, setMonthDraftTasks] = useState([]);
  const [scheduledTasks, setScheduledTasks] = useState({}); // { date: [tasks] } Each task contains startTime(minutes) and duration(minutes)
  const [storageType, setStorageType] = useState("localStorage"); // 'supabase', 'firebase', or 'localStorage'
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true); // Track if this is the first load
  const isSavingRef = useRef(false); // Track if we're currently saving to prevent listener overwrites

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag activates
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Check which storage backend is available (priority: Supabase > Firebase > localStorage)
  useEffect(() => {
    const checkStorage = async () => {
      try {
        // Check Supabase first (best option)
        const supabaseModule = await import("./utils/supabaseStorage");
        if (
          supabaseModule.isSupabaseConfigured &&
          supabaseModule.isSupabaseConfigured()
        ) {
          setStorageType("supabase");
          console.log("✅ Supabase detected, using PostgreSQL cloud storage");
          setIsLoading(false);
          return;
        }
      } catch (error) {
        // Supabase not available, continue checking
      }

      try {
        // Check Firebase as fallback
        const firebaseModule = await import("./firebase");
        if (firebaseModule.db) {
          setStorageType("firebase");
          console.log("✅ Firebase detected, using cloud storage");
          setIsLoading(false);
          return;
        }
      } catch (error) {
        // Firebase not available, continue
      }

      // Default to localStorage
      console.log("⚠️ No cloud storage configured, using localStorage");
      setStorageType("localStorage");
      setIsLoading(false);
    };

    checkStorage();
  }, []);

  // Load data from Supabase, Firebase, or localStorage
  useEffect(() => {
    if (isLoading) return;

    const loadData = async () => {
      if (storageType === "supabase") {
        try {
          // Load from Supabase
          const drafts = await loadDraftTasksSupabase();
          const scheduled = await loadScheduledTasksSupabase();

          // Handle new format with separate draft types
          if (drafts && typeof drafts === "object" && drafts !== null) {
            if (drafts.dayDraftTasks) {
              setDayDraftTasks(drafts.dayDraftTasks || {});
              setWeekDraftTasks(drafts.weekDraftTasks || []);
              setMonthDraftTasks(drafts.monthDraftTasks || []);
            } else if (Array.isArray(drafts)) {
              // Migrate old array format to new object format
              const today = format(new Date(), "yyyy-MM-dd");
              setDayDraftTasks({ [today]: drafts });
              setWeekDraftTasks([]);
              setMonthDraftTasks([]);
            } else {
              // Assume it's old format dayDraftTasks object
              setDayDraftTasks(drafts);
              setWeekDraftTasks([]);
              setMonthDraftTasks([]);
            }
          } else {
            setDayDraftTasks({});
            setWeekDraftTasks([]);
            setMonthDraftTasks([]);
          }
          setScheduledTasks(scheduled);

          // Set up real-time listeners
          const unsubscribeDrafts = subscribeToDraftTasksSupabase((tasks) => {
            if (!isSavingRef.current) {
              console.log("📥 Draft tasks updated from Supabase");
              // Handle new format with separate draft types
              if (tasks && typeof tasks === "object" && tasks !== null) {
                if (tasks.dayDraftTasks) {
                  setDayDraftTasks(tasks.dayDraftTasks || {});
                  setWeekDraftTasks(tasks.weekDraftTasks || []);
                  setMonthDraftTasks(tasks.monthDraftTasks || []);
                } else if (Array.isArray(tasks)) {
                  // Migrate old array format
                  const today = format(new Date(), "yyyy-MM-dd");
                  setDayDraftTasks({ [today]: tasks });
                  setWeekDraftTasks([]);
                  setMonthDraftTasks([]);
                } else {
                  // Assume it's old format dayDraftTasks object
                  setDayDraftTasks(tasks);
                  setWeekDraftTasks([]);
                  setMonthDraftTasks([]);
                }
              } else {
                setDayDraftTasks({});
                setWeekDraftTasks([]);
                setMonthDraftTasks([]);
              }
            } else {
              console.log(
                "⏸️ Ignoring Supabase draft update (local save in progress)"
              );
            }
          });
          const unsubscribeScheduled = subscribeToScheduledTasksSupabase(
            (tasks) => {
              if (!isSavingRef.current) {
                console.log("📥 Scheduled tasks updated from Supabase");
                setScheduledTasks(tasks);
              } else {
                console.log(
                  "⏸️ Ignoring Supabase scheduled update (local save in progress)"
                );
              }
            }
          );

          setIsInitialLoad(false);
          return () => {
            unsubscribeDrafts();
            unsubscribeScheduled();
          };
        } catch (error) {
          console.error(
            "Failed to load from Supabase, falling back to localStorage:",
            error
          );
          loadFromLocalStorage();
        }
      } else if (storageType === "firebase") {
        try {
          // Load from Firebase
          const drafts = await loadDraftTasksFirebase();
          const scheduled = await loadScheduledTasksFirebase();
          // Migrate old array format to new object format
          if (Array.isArray(drafts)) {
            const today = format(new Date(), "yyyy-MM-dd");
            setDayDraftTasks({ [today]: drafts });
          } else if (typeof drafts === "object" && drafts !== null) {
            setDayDraftTasks(drafts);
          } else {
            setDayDraftTasks({});
          }
          setScheduledTasks(scheduled);

          // Set up real-time listeners
          const unsubscribeDrafts = subscribeToDraftTasksFirebase((tasks) => {
            if (!isSavingRef.current) {
              console.log(
                "📥 Draft tasks updated from Firebase:",
                tasks.length,
                "tasks"
              );
              // Migrate old array format to new object format
              if (Array.isArray(tasks)) {
                const today = format(new Date(), "yyyy-MM-dd");
                setDayDraftTasks({ [today]: tasks });
              } else if (typeof tasks === "object" && tasks !== null) {
                setDayDraftTasks(tasks);
              } else {
                setDayDraftTasks({});
              }
            } else {
              console.log(
                "⏸️ Ignoring Firebase draft update (local save in progress)"
              );
            }
          });
          const unsubscribeScheduled = subscribeToScheduledTasksFirebase(
            (tasks) => {
              if (!isSavingRef.current) {
                console.log("📥 Scheduled tasks updated from Firebase");
                setScheduledTasks(tasks);
              } else {
                console.log(
                  "⏸️ Ignoring Firebase scheduled update (local save in progress)"
                );
              }
            }
          );

          setIsInitialLoad(false);
          return () => {
            unsubscribeDrafts();
            unsubscribeScheduled();
          };
        } catch (error) {
          console.error(
            "Failed to load from Firebase, falling back to localStorage:",
            error
          );
          loadFromLocalStorage();
        }
      } else {
        loadFromLocalStorage();
      }
    };

    const loadFromLocalStorage = () => {
      try {
        // Load separate draft types
        const savedDayDrafts = localStorage.getItem("dayDraftTasks");
        const savedWeekDrafts = localStorage.getItem("weekDraftTasks");
        const savedMonthDrafts = localStorage.getItem("monthDraftTasks");
        const savedDrafts = localStorage.getItem("draftTasks"); // Legacy support
        const savedScheduled = localStorage.getItem("scheduledTasks");

        // Load day drafts
        if (savedDayDrafts) {
          const parsed = JSON.parse(savedDayDrafts);
          if (Array.isArray(parsed)) {
            // Migrate old array format to new object format
            const today = format(new Date(), "yyyy-MM-dd");
            const migrated = { [today]: parsed };
            setDayDraftTasks(migrated);
            console.log(
              "✅ Migrated day draft tasks to date-organized format:",
              parsed.length,
              "tasks"
            );
            localStorage.setItem("dayDraftTasks", JSON.stringify(migrated));
          } else if (typeof parsed === "object" && parsed !== null) {
            setDayDraftTasks(parsed);
            const totalTasks = Object.values(parsed).reduce(
              (sum, tasks) => sum + (Array.isArray(tasks) ? tasks.length : 0),
              0
            );
            console.log(
              "✅ Loaded day draft tasks:",
              totalTasks,
              "tasks across",
              Object.keys(parsed).length,
              "days"
            );
          }
        } else if (savedDrafts) {
          // Migrate old format: all drafts become day drafts for today
          const parsed = JSON.parse(savedDrafts);
          if (Array.isArray(parsed)) {
            const today = format(new Date(), "yyyy-MM-dd");
            const migrated = { [today]: parsed };
            setDayDraftTasks(migrated);
            console.log(
              "✅ Migrated draft tasks to day drafts:",
              parsed.length,
              "tasks"
            );
            localStorage.setItem("dayDraftTasks", JSON.stringify(migrated));
          }
        }

        // Load week drafts
        if (savedWeekDrafts) {
          const parsed = JSON.parse(savedWeekDrafts);
          if (Array.isArray(parsed)) {
            setWeekDraftTasks(parsed);
            console.log("✅ Loaded week draft tasks:", parsed.length, "tasks");
          }
        }

        // Load month drafts
        if (savedMonthDrafts) {
          const parsed = JSON.parse(savedMonthDrafts);
          if (Array.isArray(parsed)) {
            setMonthDraftTasks(parsed);
            console.log("✅ Loaded month draft tasks:", parsed.length, "tasks");
          }
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
                    startTime:
                      (task.hour !== undefined ? task.hour : hour) * 60,
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
          const taskCount = Object.values(migratedData).reduce(
            (sum, tasks) => sum + tasks.length,
            0
          );
          console.log(
            "✅ Loaded scheduled tasks from localStorage:",
            taskCount,
            "tasks across",
            Object.keys(migratedData).length,
            "days"
          );
          // Save migrated data
          try {
            localStorage.setItem(
              "scheduledTasks",
              JSON.stringify(migratedData)
            );
          } catch (error) {
            console.error("Failed to save migrated data:", error);
          }
        } else {
          console.log("No scheduled tasks found in localStorage");
        }
      } catch (error) {
        console.error("Failed to load data from localStorage:", error);
      } finally {
        // Mark initial load as complete after a small delay to ensure state updates
        setTimeout(() => {
          setIsInitialLoad(false);
        }, 100);
      }
    };

    loadData();
  }, [isLoading, storageType]);

  // Save data to Supabase, Firebase, or localStorage
  useEffect(() => {
    if (isLoading || isInitialLoad) {
      // Don't save during initial load
      return;
    }

    const saveData = async () => {
      // Combine all draft types into one object for cloud storage
      const allDrafts = {
        dayDraftTasks,
        weekDraftTasks,
        monthDraftTasks,
      };

      if (storageType === "supabase") {
        try {
          isSavingRef.current = true;
          await saveDraftTasksSupabase(allDrafts);
          setTimeout(() => {
            isSavingRef.current = false;
          }, 300);
        } catch (error) {
          isSavingRef.current = false;
          console.error(
            "Failed to save to Supabase, falling back to localStorage:",
            error
          );
          // Fallback to localStorage
          try {
            localStorage.setItem(
              "dayDraftTasks",
              JSON.stringify(dayDraftTasks)
            );
            localStorage.setItem(
              "weekDraftTasks",
              JSON.stringify(weekDraftTasks)
            );
            localStorage.setItem(
              "monthDraftTasks",
              JSON.stringify(monthDraftTasks)
            );
          } catch (localError) {
            console.error("Failed to save to localStorage:", localError);
          }
        }
      } else if (storageType === "firebase") {
        try {
          isSavingRef.current = true;
          await saveDraftTasksFirebase(allDrafts);
          setTimeout(() => {
            isSavingRef.current = false;
          }, 500);
        } catch (error) {
          isSavingRef.current = false;
          console.error(
            "Failed to save to Firebase, falling back to localStorage:",
            error
          );
          // Fallback to localStorage
          try {
            localStorage.setItem(
              "dayDraftTasks",
              JSON.stringify(dayDraftTasks)
            );
            localStorage.setItem(
              "weekDraftTasks",
              JSON.stringify(weekDraftTasks)
            );
            localStorage.setItem(
              "monthDraftTasks",
              JSON.stringify(monthDraftTasks)
            );
          } catch (localError) {
            console.error("Failed to save to localStorage:", localError);
          }
        }
      } else {
        // Save all draft types to localStorage
        try {
          localStorage.setItem("dayDraftTasks", JSON.stringify(dayDraftTasks));
          localStorage.setItem(
            "weekDraftTasks",
            JSON.stringify(weekDraftTasks)
          );
          localStorage.setItem(
            "monthDraftTasks",
            JSON.stringify(monthDraftTasks)
          );
          const totalDayTasks = Object.values(dayDraftTasks).reduce(
            (sum, tasks) => sum + (Array.isArray(tasks) ? tasks.length : 0),
            0
          );
          console.log(
            "✅ Draft tasks saved:",
            totalDayTasks,
            "day tasks across",
            Object.keys(dayDraftTasks).length,
            "days,",
            weekDraftTasks.length,
            "week,",
            monthDraftTasks.length,
            "month"
          );
        } catch (error) {
          console.error("❌ Failed to save draft tasks:", error);
          if (error.name === "QuotaExceededError") {
            alert("Storage quota exceeded. Please clear some browser data.");
          }
        }
      }
    };

    saveData();
  }, [
    dayDraftTasks,
    weekDraftTasks,
    monthDraftTasks,
    isLoading,
    storageType,
    isInitialLoad,
  ]);

  useEffect(() => {
    if (isLoading || isInitialLoad) {
      // Don't save during initial load
      return;
    }

    // Get current saved data to compare
    const existingScheduled = localStorage.getItem("scheduledTasks");
    const currentScheduledStr = JSON.stringify(scheduledTasks);

    // Skip saving if data hasn't changed
    if (existingScheduled === currentScheduledStr) {
      return;
    }

    // Skip saving if empty and no existing data
    if (
      Object.keys(scheduledTasks).length === 0 &&
      (!existingScheduled || existingScheduled === "{}")
    ) {
      return;
    }

    const saveData = async () => {
      if (storageType === "supabase") {
        try {
          isSavingRef.current = true;
          await saveScheduledTasksSupabase(scheduledTasks);
          setTimeout(() => {
            isSavingRef.current = false;
          }, 300);
        } catch (error) {
          isSavingRef.current = false;
          console.error(
            "Failed to save to Supabase, falling back to localStorage:",
            error
          );
          try {
            localStorage.setItem(
              "scheduledTasks",
              JSON.stringify(scheduledTasks)
            );
          } catch (localError) {
            console.error("Failed to save to localStorage:", localError);
          }
        }
      } else if (storageType === "firebase") {
        try {
          isSavingRef.current = true;
          await saveScheduledTasksFirebase(scheduledTasks);
          setTimeout(() => {
            isSavingRef.current = false;
          }, 500);
        } catch (error) {
          isSavingRef.current = false;
          console.error(
            "Failed to save to Firebase, falling back to localStorage:",
            error
          );
          try {
            localStorage.setItem(
              "scheduledTasks",
              JSON.stringify(scheduledTasks)
            );
          } catch (localError) {
            console.error("Failed to save to localStorage:", localError);
          }
        }
      } else {
        try {
          localStorage.setItem(
            "scheduledTasks",
            JSON.stringify(scheduledTasks)
          );
          const taskCount = Object.values(scheduledTasks).reduce(
            (sum, tasks) => sum + tasks.length,
            0
          );
          console.log(
            "✅ Scheduled tasks saved to localStorage:",
            taskCount,
            "tasks across",
            Object.keys(scheduledTasks).length,
            "days"
          );
        } catch (error) {
          console.error("❌ Failed to save scheduled tasks:", error);
          if (error.name === "QuotaExceededError") {
            alert("Storage quota exceeded. Please clear some browser data.");
          }
        }
      }
    };

    saveData();
  }, [scheduledTasks, isLoading, storageType, isInitialLoad]);

  // Helper function to get current draft tasks based on view
  const getCurrentDraftTasks = () => {
    if (view === "day") {
      // For day view, return tasks for the current date
      const dateKey = format(currentDate, "yyyy-MM-dd");
      return dayDraftTasks[dateKey] || [];
    }
    if (view === "week") return weekDraftTasks;
    if (view === "month") return monthDraftTasks;
    return [];
  };

  // Helper function to set current draft tasks based on view
  const setCurrentDraftTasks = (tasks) => {
    if (view === "day") {
      // For day view, update tasks for the current date
      const dateKey = format(currentDate, "yyyy-MM-dd");
      setDayDraftTasks((prev) => ({
        ...prev,
        [dateKey]: tasks,
      }));
    } else if (view === "week") {
      setWeekDraftTasks(tasks);
    } else if (view === "month") {
      setMonthDraftTasks(tasks);
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

  const addDraftTask = (text, type = "other", id = null) => {
    const newTask = {
      id: id || Date.now().toString(),
      text,
      type,
      createdAt: new Date().toISOString(),
    };
    const currentTasks = getCurrentDraftTasks();
    setCurrentDraftTasks([...currentTasks, newTask]);
  };

  const updateDraftTask = (id, updates) => {
    const currentTasks = getCurrentDraftTasks();
    setCurrentDraftTasks(
      currentTasks.map((task) =>
        task.id === id ? { ...task, ...updates } : task
      )
    );
  };

  const deleteDraftTask = (id) => {
    const currentTasks = getCurrentDraftTasks();
    setCurrentDraftTasks(currentTasks.filter((task) => task.id !== id));
  };

  // Helper function to check if time slot is available
  const isTimeSlotAvailable = (
    date,
    startTime,
    duration,
    excludeTaskId = null
  ) => {
    const tasks = scheduledTasks[date] || [];
    const endTime = startTime + duration;

    for (const task of tasks) {
      if (excludeTaskId && task.id === excludeTaskId) continue;

      const taskStart = task.startTime || 0;
      const taskEnd = taskStart + (task.duration || 60);

      // Check for overlap
      if (startTime < taskEnd && endTime > taskStart) {
        return false;
      }
    }
    return true;
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
          const newStartTime = hour * 60;
          const duration = task.duration || 60;

          // Check if the new position is available
          if (isTimeSlotAvailable(date, newStartTime, duration, taskId)) {
            // If dragging to different date, need to move task
            if (oldDate !== date) {
              // Remove from old date
              setScheduledTasks((prev) => ({
                ...prev,
                [oldDate]: prev[oldDate].filter((t) => t.id !== taskId),
                [date]: [
                  ...(prev[date] || []),
                  { ...task, startTime: newStartTime },
                ],
              }));
            } else {
              // Moving within same day, only update start time
              setScheduledTasks((prev) => ({
                ...prev,
                [date]: prev[date].map((t) =>
                  t.id === taskId ? { ...t, startTime: newStartTime } : t
                ),
              }));
            }
          }
        }
      } else {
        // Dragging from draft to timeline
        // Check which draft type the task comes from
        let task = null;
        let sourceDate = null; // For day drafts, track which date it came from

        // Check day drafts first (need to search across all dates)
        let foundInDayDrafts = false;
        for (const [dayDate, tasks] of Object.entries(dayDraftTasks)) {
          const foundTask = tasks.find((t) => t.id === activeId);
          if (foundTask) {
            task = foundTask;
            sourceDate = dayDate;
            foundInDayDrafts = true;
            break;
          }
        }

        // Check week drafts if not found in day drafts
        if (!foundInDayDrafts) {
          const weekTask = weekDraftTasks.find((t) => t.id === activeId);
          if (weekTask) {
            task = weekTask;
          } else {
            // Check month drafts
            const monthTask = monthDraftTasks.find((t) => t.id === activeId);
            if (monthTask) {
              task = monthTask;
            }
          }
        }

        if (task) {
          // Add to schedule
          const newTask = {
            ...task,
            id: `${task.id}-${Date.now()}`,
            date,
            startTime: hour * 60,
            duration: task.duration || 60,
            source: foundInDayDrafts ? "day-draft" : undefined, // Only mark if from day draft
          };

          setScheduledTasks((prev) => ({
            ...prev,
            [date]: [...(prev[date] || []), newTask],
          }));

          // Remove from source draft
          if (foundInDayDrafts && sourceDate) {
            // Remove from day drafts for the specific date
            setDayDraftTasks((prev) => ({
              ...prev,
              [sourceDate]: (prev[sourceDate] || []).filter(
                (t) => t.id !== activeId
              ),
            }));
          } else {
            // Remove from week/month drafts
            if (weekDraftTasks.find((t) => t.id === activeId)) {
              setWeekDraftTasks(
                weekDraftTasks.filter((t) => t.id !== activeId)
              );
            } else if (monthDraftTasks.find((t) => t.id === activeId)) {
              setMonthDraftTasks(
                monthDraftTasks.filter((t) => t.id !== activeId)
              );
            }
          }
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

          // Add to day drafts for the date the task was scheduled
          setDayDraftTasks((prev) => ({
            ...prev,
            [oldDate]: [...(prev[oldDate] || []), draftTask],
          }));
        }
      }
    }

    // If dragging to a day cell in week/month view
    if (overId.startsWith("day-cell-")) {
      // Format: day-cell-yyyy-MM-dd
      const date = overId.replace("day-cell-", "");

      // Check if dragged from week/month drafts
      const weekTask = weekDraftTasks.find((t) => t.id === activeId);
      const monthTask = monthDraftTasks.find((t) => t.id === activeId);

      if (weekTask) {
        // Move from week draft to scheduled tasks (for week view) AND day drafts
        setWeekDraftTasks(weekDraftTasks.filter((t) => t.id !== activeId));

        // Add to scheduled tasks so it appears in week view right panel
        const dateObj = new Date(date + "T00:00:00");
        const startTime = getNextAvailableTime(dateObj);
        const scheduledTask = {
          ...weekTask,
          id: `${weekTask.id}-${Date.now()}`,
          date: date,
          startTime: startTime,
          duration: weekTask.duration || 60,
          source: "week-draft", // Mark as from week draft
        };
        setScheduledTasks((prev) => ({
          ...prev,
          [date]: [...(prev[date] || []), scheduledTask],
        }));

        // Add to day drafts for the specific date
        setDayDraftTasks((prev) => ({
          ...prev,
          [date]: [...(prev[date] || []), weekTask],
        }));
      } else if (monthTask) {
        // Move from month draft to scheduled tasks (for month view) AND day drafts
        setMonthDraftTasks(monthDraftTasks.filter((t) => t.id !== activeId));

        // Add to scheduled tasks so it appears in month view right panel
        const dateObj = new Date(date + "T00:00:00");
        const startTime = getNextAvailableTime(dateObj);
        const scheduledTask = {
          ...monthTask,
          id: `${monthTask.id}-${Date.now()}`,
          date: date,
          startTime: startTime,
          duration: monthTask.duration || 60,
          source: "month-draft", // Mark as from month draft
        };
        setScheduledTasks((prev) => ({
          ...prev,
          [date]: [...(prev[date] || []), scheduledTask],
        }));

        // Add to day drafts for the specific date
        setDayDraftTasks((prev) => ({
          ...prev,
          [date]: [...(prev[date] || []), monthTask],
        }));
      }
    }

    // If reordering within draft panel
    if (
      activeId !== overId &&
      !overId.startsWith("time-slot-") &&
      overId !== "draft-list" &&
      !overId.startsWith("day-cell-")
    ) {
      const currentTasks = getCurrentDraftTasks();
      const oldIndex = currentTasks.findIndex((t) => t.id === activeId);
      const newIndex = currentTasks.findIndex((t) => t.id === overId);

      if (oldIndex !== -1 && newIndex !== -1) {
        setCurrentDraftTasks(arrayMove(currentTasks, oldIndex, newIndex));
      }
    }
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
      source: "day-draft", // Mark as from day draft
    };

    setScheduledTasks((prev) => ({
      ...prev,
      [dateKey]: [...(prev[dateKey] || []), newTask],
    }));

    // Remove from day drafts for the current date
    const currentTasks = getCurrentDraftTasks();
    setCurrentDraftTasks(currentTasks.filter((t) => t.id !== task.id));
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
    const currentTasks = getCurrentDraftTasks();
    setCurrentDraftTasks([...currentTasks, newTask]);
    deleteScheduledTask(date, task.id);
  };

  const toggleTaskComplete = (date, taskId, completed) => {
    updateScheduledTask(date, taskId, { completed });
  };

  const handleResizeTask = (date, taskId, newStartTime, newDuration) => {
    updateScheduledTask(date, taskId, {
      startTime: newStartTime,
      duration: newDuration,
    });
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
            tasks={getCurrentDraftTasks()}
            onAddTask={addDraftTask}
            onDeleteTask={deleteDraftTask}
            onUpdateTask={updateDraftTask}
            onAddToSchedule={addTaskToSchedule}
            currentDate={currentDate}
            scheduledTasks={scheduledTasks}
            taskTypes={TASK_TYPES}
            view={view}
          />

          <div className="schedule-view">
            {view === "day" && (
              <DayView
                date={currentDate}
                scheduledTasks={scheduledTasks}
                onDeleteTask={deleteScheduledTask}
                onUpdateTask={updateScheduledTask}
                onMoveToDraft={moveTaskToDraft}
                onToggleComplete={toggleTaskComplete}
                onResizeTask={handleResizeTask}
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
                weekDraftTasks={weekDraftTasks}
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
                monthDraftTasks={monthDraftTasks}
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
