import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

/**
 * A localStorage hook that automatically prefixes keys with the user's ID.
 * This ensures each user has their own separate data storage.
 *
 * @param {string}  key          — localStorage key (will be prefixed with user ID)
 * @param {*}       defaultValue — fallback when nothing is stored yet
 * @returns {[*, Function]}      — same tuple as useState
 */
export default function useUserStorage(key, defaultValue) {
  const { user } = useAuth();
  
  // Create a user-specific key
  const userKey = user ? `user_${user.uid}_${key}` : `guest_${key}`;
  
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(userKey);
      return stored !== null ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(userKey, JSON.stringify(value));
    } catch {
      // silently ignore in environments where localStorage is blocked
    }
  }, [userKey, value]);

  return [value, setValue];
}
