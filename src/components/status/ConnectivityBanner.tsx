"use client";

import { useEffect, useState } from "react";

export default function ConnectivityBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const updateStatus = () => {
      setIsOnline(window.navigator.onLine);
      setHasLoaded(true);
    };

    updateStatus();

    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);

    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  if (!hasLoaded || isOnline) {
    return null;
  }

  return (
    <div className="connectivity-banner" role="status">
      <span aria-hidden="true">●</span>
      <div>
        <strong>You are offline</strong>
        <small>
          Previously loaded content and locally saved progress remain
          available.
        </small>
      </div>
    </div>
  );
}
