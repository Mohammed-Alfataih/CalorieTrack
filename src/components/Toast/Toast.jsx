import { useEffect } from "react";
import "./Toast.css";

/**
 * A notification toast that auto-dismisses after 3.2 seconds.
 *
 * @param {{ message: string, onClose: () => void }} props
 */
export default function Toast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3200);
    return () => clearTimeout(timer);
  }, [onClose]);

  return <div className="toast">{message}</div>;
}
