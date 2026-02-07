import { useState, useEffect } from "react";

/**
 * A localStorage hook that scopes data to the current user.
 * 
 * This ensures each user's data is separate - when they log out
 * and a different user logs in, they won't see the previous user's data.
 *
 * @param {string}  key          — base localStorage key
 * @param {*}       defaultValue — fallback when nothing is stored yet
 * @param {string}  userId       — current user's ID (makes storage user-specific)
 * @returns {[*, Function]}      — same tuple as useState
 */
export default function useStorage(key, defaultValue, userId = null) {
  // Create a user-specific key if userId is provided
  const storageKey = userId ? `${userId}:${key}` : key;
  
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored !== null ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      // silently ignore in environments where localStorage is blocked
    }
  }, [storageKey, value]);

  return [value, setValue];
}
