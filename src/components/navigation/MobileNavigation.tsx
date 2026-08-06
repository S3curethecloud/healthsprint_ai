"use client";

import { useEffect, useState } from "react";

const navigationItems = [
  {
    targetId: "dashboard",
    label: "Today",
    icon: "◉",
  },
  {
    targetId: "meals",
    label: "Meals",
    icon: "▤",
  },
  {
    targetId: "activity",
    label: "Activity",
    icon: "↗",
  },
  {
    targetId: "progress",
    label: "Progress",
    icon: "▥",
  },
];

export default function MobileNavigation() {
  const [activeSection, setActiveSection] = useState("dashboard");

  useEffect(() => {
    function updateActiveSection() {
      const offset = window.scrollY + 180;

      let currentSection = "dashboard";

      for (const item of navigationItems) {
        const element = document.getElementById(item.targetId);

        if (element && element.offsetTop <= offset) {
          currentSection = item.targetId;
        }
      }

      setActiveSection(currentSection);
    }

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", updateActiveSection);
    };
  }, []);

  function navigateToSection(targetId: string) {
    setActiveSection(targetId);

    if (targetId === "dashboard") {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    const target = document.getElementById(targetId);

    if (!target) {
      console.warn(`Navigation target not found: ${targetId}`);
      return;
    }

    const navigationOffset = 110;
    const targetTop =
      target.getBoundingClientRect().top +
      window.scrollY -
      navigationOffset;

    window.scrollTo({
      top: Math.max(0, targetTop),
      behavior: "smooth",
    });
  }

  return (
    <nav className="mobile-navigation" aria-label="Primary navigation">
      {navigationItems.map((item) => {
        const isActive = activeSection === item.targetId;

        return (
          <button
            type="button"
            className={isActive ? "active" : ""}
            aria-current={isActive ? "page" : undefined}
            aria-label={`Go to ${item.label}`}
            onClick={() => navigateToSection(item.targetId)}
            key={item.targetId}
          >
            <span aria-hidden="true">{item.icon}</span>
            <small>{item.label}</small>
          </button>
        );
      })}
    </nav>
  );
}
