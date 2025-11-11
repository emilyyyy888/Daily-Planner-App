// Supabase storage utilities for tasks
// Supabase is a better alternative to Firebase - PostgreSQL database with generous free tier
// Free tier: 500MB database, 1GB file storage, 2GB bandwidth

import { createClient } from "@supabase/supabase-js";

// Supabase configuration - Replace with your project credentials
// Get them from: https://app.supabase.com → Your Project → Settings → API
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Check if Supabase is configured
const isSupabaseAvailable = () => {
  return (
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    SUPABASE_URL !== "" &&
    SUPABASE_ANON_KEY !== ""
  );
};

let supabase = null;

if (isSupabaseAvailable()) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("✅ Supabase initialized successfully");
  } catch (error) {
    console.error("❌ Supabase initialization error:", error);
    supabase = null;
  }
} else {
  console.log(
    "⚠️ Supabase not configured. See SUPABASE_SETUP.md for setup instructions."
  );
}

// Export supabase instance and availability check
export { supabase };
export const isSupabaseConfigured = () => supabase !== null;

const DRAFTS_TABLE = "draft_tasks";
const SCHEDULED_TABLE = "scheduled_tasks";

// Generate a unique user ID (using localStorage to persist user ID)
const getUserId = () => {
  let userId = localStorage.getItem("userId");
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("userId", userId);
  }
  return userId;
};

// Save draft tasks to Supabase
export const saveDraftTasks = async (tasks) => {
  if (!isSupabaseAvailable() || !supabase) {
    throw new Error("Supabase is not configured");
  }

  try {
    const userId = getUserId();
    const { error } = await supabase.from(DRAFTS_TABLE).upsert(
      {
        user_id: userId,
        tasks: tasks,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      }
    );

    if (error) throw error;

    console.log("✅ Draft tasks saved to Supabase:", tasks.length, "tasks");
    return true;
  } catch (error) {
    console.error("❌ Failed to save draft tasks to Supabase:", error);
    throw error;
  }
};

// Load draft tasks from Supabase
export const loadDraftTasks = async () => {
  if (!isSupabaseAvailable() || !supabase) {
    throw new Error("Supabase is not configured");
  }

  try {
    const userId = getUserId();
    const { data, error } = await supabase
      .from(DRAFTS_TABLE)
      .select("tasks")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      throw error;
    }

    if (data && data.tasks) {
      console.log(
        "✅ Draft tasks loaded from Supabase:",
        data.tasks.length,
        "tasks"
      );
      return data.tasks;
    } else {
      console.log("No draft tasks found in Supabase");
      return [];
    }
  } catch (error) {
    console.error("❌ Failed to load draft tasks from Supabase:", error);
    throw error;
  }
};

// Save scheduled tasks to Supabase
export const saveScheduledTasks = async (tasks) => {
  if (!isSupabaseAvailable() || !supabase) {
    throw new Error("Supabase is not configured");
  }

  try {
    const userId = getUserId();
    const { error } = await supabase.from(SCHEDULED_TABLE).upsert(
      {
        user_id: userId,
        tasks: tasks,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      }
    );

    if (error) throw error;

    const taskCount = Object.values(tasks).reduce(
      (sum, taskArray) => sum + taskArray.length,
      0
    );
    console.log("✅ Scheduled tasks saved to Supabase:", taskCount, "tasks");
    return true;
  } catch (error) {
    console.error("❌ Failed to save scheduled tasks to Supabase:", error);
    throw error;
  }
};

// Load scheduled tasks from Supabase
export const loadScheduledTasks = async () => {
  if (!isSupabaseAvailable() || !supabase) {
    throw new Error("Supabase is not configured");
  }

  try {
    const userId = getUserId();
    const { data, error } = await supabase
      .from(SCHEDULED_TABLE)
      .select("tasks")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      throw error;
    }

    if (data && data.tasks) {
      console.log("✅ Scheduled tasks loaded from Supabase");
      return data.tasks || {};
    } else {
      console.log("No scheduled tasks found in Supabase");
      return {};
    }
  } catch (error) {
    console.error("❌ Failed to load scheduled tasks from Supabase:", error);
    throw error;
  }
};

// Set up real-time listener for draft tasks
export const subscribeToDraftTasks = (callback) => {
  if (!isSupabaseAvailable() || !supabase) {
    console.warn("Supabase not available, cannot set up real-time listener");
    return () => {}; // Return empty unsubscribe function
  }

  const userId = getUserId();

  const channel = supabase
    .channel(`draft_tasks:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: DRAFTS_TABLE,
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (payload.new && payload.new.tasks) {
          callback(payload.new.tasks);
        } else {
          callback([]);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// Set up real-time listener for scheduled tasks
export const subscribeToScheduledTasks = (callback) => {
  if (!isSupabaseAvailable() || !supabase) {
    console.warn("Supabase not available, cannot set up real-time listener");
    return () => {}; // Return empty unsubscribe function
  }

  const userId = getUserId();

  const channel = supabase
    .channel(`scheduled_tasks:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: SCHEDULED_TABLE,
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (payload.new && payload.new.tasks) {
          callback(payload.new.tasks);
        } else {
          callback({});
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
