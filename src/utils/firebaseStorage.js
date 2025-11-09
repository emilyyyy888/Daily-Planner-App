// Firebase storage utilities for tasks

import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  onSnapshot,
  query,
  where
} from 'firebase/firestore';
import { db } from '../firebase';

// Check if Firebase is available
const isFirebaseAvailable = () => {
  return db !== null && db !== undefined;
};

const DRAFTS_COLLECTION = 'draftTasks';
const SCHEDULED_COLLECTION = 'scheduledTasks';

// Generate a unique user ID (for now, using localStorage to persist user ID)
const getUserId = () => {
  let userId = localStorage.getItem('userId');
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('userId', userId);
  }
  return userId;
};

// Save draft tasks to Firebase
export const saveDraftTasks = async (tasks) => {
  if (!isFirebaseAvailable()) {
    throw new Error('Firebase is not configured');
  }
  
  try {
    const userId = getUserId();
    const userDocRef = doc(db, DRAFTS_COLLECTION, userId);
    await setDoc(userDocRef, {
      tasks: tasks,
      updatedAt: new Date().toISOString()
    });
    console.log('✅ Draft tasks saved to Firebase:', tasks.length, 'tasks');
    return true;
  } catch (error) {
    console.error('❌ Failed to save draft tasks to Firebase:', error);
    throw error;
  }
};

// Load draft tasks from Firebase
export const loadDraftTasks = async () => {
  if (!isFirebaseAvailable()) {
    throw new Error('Firebase is not configured');
  }
  
  try {
    const userId = getUserId();
    const userDocRef = doc(db, DRAFTS_COLLECTION, userId);
    const docSnap = await getDoc(userDocRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('✅ Draft tasks loaded from Firebase:', data.tasks?.length || 0, 'tasks');
      return data.tasks || [];
    } else {
      console.log('No draft tasks found in Firebase');
      return [];
    }
  } catch (error) {
    console.error('❌ Failed to load draft tasks from Firebase:', error);
    throw error;
  }
};

// Save scheduled tasks to Firebase
export const saveScheduledTasks = async (tasks) => {
  if (!isFirebaseAvailable()) {
    throw new Error('Firebase is not configured');
  }
  
  try {
    const userId = getUserId();
    const userDocRef = doc(db, SCHEDULED_COLLECTION, userId);
    await setDoc(userDocRef, {
      tasks: tasks,
      updatedAt: new Date().toISOString()
    });
    const taskCount = Object.values(tasks).reduce((sum, taskArray) => sum + taskArray.length, 0);
    console.log('✅ Scheduled tasks saved to Firebase:', taskCount, 'tasks');
    return true;
  } catch (error) {
    console.error('❌ Failed to save scheduled tasks to Firebase:', error);
    throw error;
  }
};

// Load scheduled tasks from Firebase
export const loadScheduledTasks = async () => {
  if (!isFirebaseAvailable()) {
    throw new Error('Firebase is not configured');
  }
  
  try {
    const userId = getUserId();
    const userDocRef = doc(db, SCHEDULED_COLLECTION, userId);
    const docSnap = await getDoc(userDocRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('✅ Scheduled tasks loaded from Firebase');
      return data.tasks || {};
    } else {
      console.log('No scheduled tasks found in Firebase');
      return {};
    }
  } catch (error) {
    console.error('❌ Failed to load scheduled tasks from Firebase:', error);
    throw error;
  }
};

// Set up real-time listener for draft tasks
export const subscribeToDraftTasks = (callback) => {
  if (!isFirebaseAvailable()) {
    console.warn('Firebase not available, cannot set up real-time listener');
    return () => {}; // Return empty unsubscribe function
  }
  
  const userId = getUserId();
  const userDocRef = doc(db, DRAFTS_COLLECTION, userId);
  
  return onSnapshot(userDocRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      callback(data.tasks || []);
    } else {
      callback([]);
    }
  }, (error) => {
    console.error('Error listening to draft tasks:', error);
  });
};

// Set up real-time listener for scheduled tasks
export const subscribeToScheduledTasks = (callback) => {
  if (!isFirebaseAvailable()) {
    console.warn('Firebase not available, cannot set up real-time listener');
    return () => {}; // Return empty unsubscribe function
  }
  
  const userId = getUserId();
  const userDocRef = doc(db, SCHEDULED_COLLECTION, userId);
  
  return onSnapshot(userDocRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      callback(data.tasks || {});
    } else {
      callback({});
    }
  }, (error) => {
    console.error('Error listening to scheduled tasks:', error);
  });
};

