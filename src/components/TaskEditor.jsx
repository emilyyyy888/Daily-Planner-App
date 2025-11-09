import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "./TaskEditor.css";

const DURATION_OPTIONS = [
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "1 hour", value: 60 },
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
  const [duration, setDuration] = useState(() => {
    return task.duration !== undefined ? task.duration : 60;
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
    setDuration(newDefaultDuration);
    setSelectedType(task.type || "other");
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
    if (isDraft) {
      // When saving draft task, save task text, time info, and task type
      onSave({
        text: taskText.trim(),
        startTime: newStartTime,
        duration: duration,
        type: selectedType,
      });
    } else {
      // For scheduled tasks, update time and duration
      onSave({
        startTime: newStartTime,
        duration: duration,
      });
    }
    onClose();
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}`;
  };

  const currentStartTime = startHour * 60 + startMinute;
  const currentEndTime =
    currentStartTime +
    (typeof duration === "number" ? duration : parseInt(duration) || 15);

  return createPortal(
    <div className="task-editor-overlay" ref={overlayRef} onClick={onClose}>
      <div
        className="task-editor"
        ref={editorRef}
        onClick={(e) => e.stopPropagation()}
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
            {isDraft ? (
              <input
                type="text"
                value={taskText}
                onChange={(e) => setTaskText(e.target.value)}
                className="task-editor-text-input"
                placeholder="Enter task name..."
              />
            ) : (
              <div className="task-editor-text">{task.text}</div>
            )}
          </div>

          {isDraft && (
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
          )}

          <div className="task-editor-field">
            <label>Start Time</label>
            <div className="time-inputs">
              <select
                value={startHour}
                onChange={(e) => setStartHour(parseInt(e.target.value))}
                className="time-select"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, "0")}
                  </option>
                ))}
              </select>
              <span>:</span>
              <select
                value={startMinute}
                onChange={(e) => setStartMinute(parseInt(e.target.value))}
                className="time-select"
              >
                {[0, 15, 30, 45].map((min) => (
                  <option key={min} value={min}>
                    {min.toString().padStart(2, "0")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="task-editor-field">
            <label>Duration</label>
            <div className="duration-options">
              {DURATION_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  className={`duration-btn ${
                    duration === option.value ? "active" : ""
                  }`}
                  onClick={() => setDuration(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="duration-custom">
              <input
                type="text"
                inputMode="numeric"
                value={duration === "" ? "" : duration}
                onChange={(e) => {
                  const value = e.target.value;
                  // Only allow numeric input
                  if (value === "" || /^\d+$/.test(value)) {
                    if (value === "") {
                      setDuration("");
                    } else {
                      const numValue = parseInt(value);
                      if (numValue <= 480) {
                        setDuration(numValue);
                      } else {
                        setDuration(480);
                      }
                    }
                  }
                }}
                onBlur={(e) => {
                  const value = e.target.value;
                  if (
                    value === "" ||
                    isNaN(parseInt(value)) ||
                    parseInt(value) < 15
                  ) {
                    setDuration(15);
                  } else {
                    const numValue = parseInt(value);
                    if (numValue > 480) {
                      setDuration(480);
                    } else {
                      // Round to nearest multiple of 15
                      setDuration(Math.round(numValue / 15) * 15);
                    }
                  }
                }}
                className="duration-input"
                placeholder="Enter minutes"
              />
              <span>min</span>
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
