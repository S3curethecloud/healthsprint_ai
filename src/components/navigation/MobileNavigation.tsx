"use client";

import { useEffect, useRef, useState } from "react";

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

const USER_SELECTION_LOCK_MS = 700;

export default function MobileNavigation() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const userSelectionLocked = useRef(false);
  const selectionLockTimeout = useRef<number | null>(null);

  useEffect(() => {
    function updateActiveSection() {
      if (userSelectionLocked.current) {
        return;
      }

      const navigationLine = 170;

      const sections = navigationItems
        .map((item) => {
          const element = document.getElementById(item.targetId);

          if (!element) {
            return null;
          }

          return {
            targetId: item.targetId,
            top: element.getBoundingClientRect().top,
          };
        })
        .filter(
          (
            section,
          ): section is {
            targetId: string;
            top: number;
          } => section !== null,
        )
        .sort((first, second) => first.top - second.top);

      const passedSections = sections.filter(
        (section) => section.top <= navigationLine,
      );

      const nearestPassedSection =
        passedSections[passedSections.length - 1];

      if (nearestPassedSection) {
        setActiveSection(nearestPassedSection.targetId);
        return;
      }

      if (sections[0]) {
        setActiveSection(sections[0].targetId);
      }
    }

    updateActiveSection();

    window.addEventListener("scroll", updateActiveSection, {
      passive: true,
    });

    window.addEventListener("resize", updateActiveSection);

    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);

      if (selectionLockTimeout.current !== null) {
        window.clearTimeout(selectionLockTimeout.current);
      }
    };
  }, []);

  function navigateToSection(targetId: string) {
    setActiveSection(targetId);
    userSelectionLocked.current = true;

    if (selectionLockTimeout.current !== null) {
      window.clearTimeout(selectionLockTimeout.current);
    }

    selectionLockTimeout.current = window.setTimeout(() => {
      userSelectionLocked.current = false;
    }, USER_SELECTION_LOCK_MS);

    if (targetId === "dashboard") {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    const target = document.getElementById(targetId);

    if (!target) {
      return;
    }

    const navigationOffset = 92;
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
