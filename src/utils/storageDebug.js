// Storage debugging utilities

export const checkLocalStorage = () => {
  const results = {
    available: typeof Storage !== "undefined",
    draftTasks: null,
    scheduledTasks: null,
    error: null,
  };

  try {
    if (!results.available) {
      results.error = "localStorage is not available in this browser";
      return results;
    }

    // Check if localStorage is accessible
    const testKey = "__storage_test__";
    localStorage.setItem(testKey, "test");
    localStorage.removeItem(testKey);

    // Read saved data
    const draftData = localStorage.getItem("draftTasks");
    const scheduledData = localStorage.getItem("scheduledTasks");

    results.draftTasks = draftData ? JSON.parse(draftData) : null;
    results.scheduledTasks = scheduledData ? JSON.parse(scheduledData) : null;

    return results;
  } catch (error) {
    results.error = error.message;
    return results;
  }
};

export const exportData = () => {
  try {
    const draftTasks = localStorage.getItem("draftTasks");
    const scheduledTasks = localStorage.getItem("scheduledTasks");

    const data = {
      draftTasks: draftTasks ? JSON.parse(draftTasks) : [],
      scheduledTasks: scheduledTasks ? JSON.parse(scheduledTasks) : {},
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `schedule-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error("Failed to export data:", error);
    return false;
  }
};

export const importData = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.draftTasks) {
          localStorage.setItem("draftTasks", JSON.stringify(data.draftTasks));
        }
        if (data.scheduledTasks) {
          localStorage.setItem(
            "scheduledTasks",
            JSON.stringify(data.scheduledTasks)
          );
        }
        resolve(true);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

