"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

function isStandaloneMode() {
  if (typeof window === "undefined") {
    return false;
  }

  const standaloneMedia = window.matchMedia(
    "(display-mode: standalone)",
  ).matches;

  const navigatorWithStandalone = window.navigator as Navigator & {
    standalone?: boolean;
  };

  return standaloneMedia || navigatorWithStandalone.standalone === true;
}

export default function InstallPrompt() {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(isStandaloneMode);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setInstallEvent(null);
      setIsInstalled(true);
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleInstallPrompt,
    );
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  async function installApplication() {
    if (!installEvent) {
      return;
    }

    await installEvent.prompt();

    const choice = await installEvent.userChoice;

    if (choice.outcome === "accepted") {
      setIsInstalled(true);
    }

    setInstallEvent(null);
  }

  if (isInstalled || isDismissed || !installEvent) {
    return null;
  }

  return (
    <aside className="install-card" aria-label="Install HealthSprint AI">
      <Image
        src="/healthsprint-icon.svg"
        alt=""
        width={52}
        height={52}
        unoptimized
      />

      <div>
        <p className="eyebrow">Installable application</p>
        <h2>Add HealthSprint AI to your device</h2>
        <p>
          Open it from your home screen and continue tracking with a
          focused app experience.
        </p>
      </div>

      <div className="install-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={() => setIsDismissed(true)}
        >
          Not now
        </button>

        <button
          type="button"
          className="primary-button"
          onClick={installApplication}
        >
          Install app
        </button>
      </div>
    </aside>
  );
}
