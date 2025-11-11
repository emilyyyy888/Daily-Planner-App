import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "./TaskEditor.css";

const DURATION_OPTIONS = [
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "1 hour", value: 60 },
  { label: "1h 20min", value: 80 },
  { label: "1.5 hours", value: 90 },
  { label: "2 hours", value: 120 },
  { label: "3 hours", value: 180 },
];

function TaskEditor({
  task,
  onSave,
  onClose,
  isDraft = false,
  taskTypes = [],
}) {
  // If it's a draft task without startTime and duration, use default values
  const defaultStartTime =
    task.startTime !== undefined ? task.startTime : 9 * 60; // Default 9:00
  const defaultDuration = task.duration !== undefined ? task.duration : 60; // Default 1 hour

  const [taskText, setTaskText] = useState(task.text || "");
  const [startHour, setStartHour] = useState(() => {
    const time = task.startTime !== undefined ? task.startTime : 9 * 60;
    return Math.floor(time / 60);
  });
  const [startMinute, setStartMinute] = useState(() => {
    const time = task.startTime !== undefined ? task.startTime : 9 * 60;
    return time % 60;
  });
  const [durationHours, setDurationHours] = useState(() => {
    const dur = task.duration !== undefined ? task.duration : 60;
    return Math.floor(dur / 60);
  });
  const [durationMinutes, setDurationMinutes] = useState(() => {
    const dur = task.duration !== undefined ? task.duration : 60;
    return dur % 60;
  });
  const [selectedType, setSelectedType] = useState(task.type || "other");
  const editorRef = useRef(null);
  const overlayRef = useRef(null);

  // Update state when task changes (for editing saved draft tasks)
  useEffect(() => {
    const newDefaultStartTime =
      task.startTime !== undefined ? task.startTime : 9 * 60;
    const newDefaultDuration = task.duration !== undefined ? task.duration : 60;

    setTaskText(task.text || "");
    setStartHour(Math.floor(newDefaultStartTime / 60));
    setStartMinute(newDefaultStartTime % 60);
    setDurationHours(Math.floor(newDefaultDuration / 60));
    setDurationMinutes(newDefaultDuration % 60);
    setSelectedType(task.type || "other");
    // Use a combination of id (or undefined) and startTime as key to handle new tasks
  }, [task.id, task.startTime, task.duration, task.text, task.type]);

  useEffect(() => {
    // Prevent background scrolling, maintain current scroll position
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    // Lock page scrolling
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = `-${scrollX}px`;
    document.body.style.width = "100%";

    return () => {
      // Restore scrolling
      const bodyTop = document.body.style.top;
      const bodyLeft = document.body.style.left;
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.width = "";
      window.scrollTo(scrollX, scrollY);
    };
  }, []);

  const handleSave = () => {
    const newStartTime = startHour * 60 + startMinute;
    const newDuration = durationHours * 60 + durationMinutes;
    if (isDraft) {
      // When saving draft task, save task text, time info, and task type
      onSave({
        text: taskText.trim(),
        startTime: newStartTime,
        duration: newDuration,
        type: selectedType,
      });
    } else {
      // For scheduled tasks, update text, time, duration, and task type
      onSave({
        text: taskText.trim(),
        startTime: newStartTime,
        duration: newDuration,
        type: selectedType,
      });
    }
    onClose();
  };

  const handleKeyDown = (e) => {
    // Save on Enter key, but not if user is typing in text input (allow Enter for multi-line)
    // For number inputs, Enter will save
    if (e.key === "Enter" && !e.shiftKey) {
      // Check if the target is a button or if it's a text input
      const target = e.target;
      if (
        target.tagName === "BUTTON" ||
        target.type === "number" ||
        (target.type === "text" &&
          target.className.includes("task-editor-text-input"))
      ) {
        e.preventDefault();
        handleSave();
      }
    }
    // Close on Escape key
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}`;
  };

  const currentStartTime = startHour * 60 + startMinute;
  const currentDuration = durationHours * 60 + durationMinutes;
  const currentEndTime = currentStartTime + currentDuration;

  return createPortal(
    <div className="task-editor-overlay" ref={overlayRef} onClick={onClose}>
      <div
        className="task-editor"
        ref={editorRef}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        <div className="task-editor-header">
          <h3>{isDraft ? "Edit Draft Task" : "Edit Task"}</h3>
          <button className="task-editor-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="task-editor-content">
          <div className="task-editor-field">
            <label>Task Name</label>
            <input
              type="text"
              value={taskText}
              onChange={(e) => setTaskText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSave();
                }
              }}
              className="task-editor-text-input"
              placeholder="Enter task name..."
            />
          </div>

          <div className="task-editor-field">
            <label>Task Type</label>
            <div className="task-type-selector">
              {taskTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  className={`type-btn ${
                    selectedType === type.id ? "active" : ""
                  }`}
                  onClick={() => setSelectedType(type.id)}
                  style={{
                    backgroundColor:
                      selectedType === type.id ? type.color : "transparent",
                    borderColor: type.color,
                    color: selectedType === type.id ? "white" : type.color,
                  }}
                >
                  {type.name}
                </button>
              ))}
            </div>
          </div>

          <div className="task-editor-field">
            <label>Start Time</label>
            <div className="time-inputs">
              <input
                type="number"
                min="0"
                max="23"
                value={startHour}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "") {
                    setStartHour(0);
                    return;
                  }
                  const value = parseInt(val, 10);
                  if (!isNaN(value) && value >= 0 && value <= 23) {
                    setStartHour(value);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSave();
                  }
                }}
                onBlur={(e) => {
                  if (
                    e.target.value === "" ||
                    isNaN(parseInt(e.target.value, 10))
                  ) {
                    setStartHour(0);
                  }
                }}
                className="time-input-number"
                placeholder="00"
              />
              <span>:</span>
              <input
                type="number"
                min="0"
                max="59"
                value={startMinute}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "") {
                    setStartMinute(0);
                    return;
                  }
                  const value = parseInt(val, 10);
                  if (!isNaN(value) && value >= 0 && value <= 59) {
                    setStartMinute(value);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSave();
                  }
                }}
                onBlur={(e) => {
                  if (
                    e.target.value === "" ||
                    isNaN(parseInt(e.target.value, 10))
                  ) {
                    setStartMinute(0);
                  }
                }}
                className="time-input-number"
                placeholder="00"
              />
            </div>
          </div>

          <div className="task-editor-field">
            <label>Duration</label>
            <div className="duration-options">
              {DURATION_OPTIONS.map((option) => {
                const optionHours = Math.floor(option.value / 60);
                const optionMinutes = option.value % 60;
                const isActive =
                  durationHours === optionHours &&
                  durationMinutes === optionMinutes;
                return (
                  <button
                    key={option.value}
                    className={`duration-btn ${isActive ? "active" : ""}`}
                    onClick={() => {
                      setDurationHours(optionHours);
                      setDurationMinutes(optionMinutes);
                    }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            <div className="duration-custom">
              <div className="time-inputs">
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={durationHours}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    if (value >= 0 && value <= 23) {
                      setDurationHours(value);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSave();
                    }
                  }}
                  className="duration-input-number"
                />
                <span>hours</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={durationMinutes}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    if (value >= 0 && value <= 59) {
                      setDurationMinutes(value);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSave();
                    }
                  }}
                  className="duration-input-number"
                />
                <span>minutes</span>
              </div>
            </div>
          </div>

          <div className="task-editor-info">
            <div>End Time: {formatTime(currentEndTime)}</div>
          </div>
        </div>

        <div className="task-editor-footer">
          <button className="task-editor-btn cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="task-editor-btn save" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default TaskEditor;
