"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const navigationItems = [
  {
    targetId: "dashboard",
    label: "Today",
    description: "Daily overview",
    icon: "◉",
  },
  {
    targetId: "meals",
    label: "Meals",
    description: "Nutrition plan",
    icon: "▤",
  },
  {
    targetId: "activity",
    label: "Activity",
    description: "Movement and water",
    icon: "↗",
  },
  {
    targetId: "progress",
    label: "Progress",
    description: "45-day journey",
    icon: "▥",
  },
];

const USER_SELECTION_LOCK_MS = 900;

export default function DesktopNavigation() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const userSelectionLocked = useRef(false);
  const selectionLockTimeout = useRef<number | null>(null);
  const highlightTimeout = useRef<number | null>(null);

  useEffect(() => {
    function updateActiveSection() {
      if (userSelectionLocked.current) {
        return;
      }

      const navigationLine = 190;

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

      const nearestUpcomingSection = sections[0];

      if (nearestUpcomingSection) {
        setActiveSection(nearestUpcomingSection.targetId);
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

      if (highlightTimeout.current !== null) {
        window.clearTimeout(highlightTimeout.current);
      }
    };
  }, []);

  function highlightTarget(target: HTMLElement) {
    document
      .querySelectorAll(".navigation-target-highlight")
      .forEach((element) => {
        element.classList.remove("navigation-target-highlight");
      });

    target.classList.add("navigation-target-highlight");

    if (highlightTimeout.current !== null) {
      window.clearTimeout(highlightTimeout.current);
    }

    highlightTimeout.current = window.setTimeout(() => {
      target.classList.remove("navigation-target-highlight");
    }, 1100);
  }

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

    target.setAttribute("tabindex", "-1");

    const navigationOffset = 104;
    const targetTop =
      target.getBoundingClientRect().top +
      window.scrollY -
      navigationOffset;

    window.scrollTo({
      top: Math.max(0, targetTop),
      behavior: "smooth",
    });

    highlightTarget(target);

    window.setTimeout(() => {
      target.focus({
        preventScroll: true,
      });
    }, 350);
  }

  return (
    <aside
      className="desktop-navigation"
      aria-label="Application navigation"
    >
      <div className="desktop-brand">
        <Image
          src="/healthsprint-icon.svg"
          alt=""
          width={42}
          height={42}
          unoptimized
        />

        <div>
          <strong>HealthSprint AI</strong>
          <small>Nutrition coach</small>
        </div>
      </div>

      <nav aria-label="Dashboard sections">
        {navigationItems.map((item) => {
          const isActive = activeSection === item.targetId;

          return (
            <button
              type="button"
              className={isActive ? "active" : ""}
              aria-current={isActive ? "page" : undefined}
              onClick={() => navigateToSection(item.targetId)}
              key={item.targetId}
            >
              <span
                className="desktop-nav-icon"
                aria-hidden="true"
              >
                {item.icon}
              </span>

              <span>
                <strong>{item.label}</strong>
                <small>{item.description}</small>
              </span>
            </button>
          );
        })}
      </nav>

      <div className="desktop-navigation-footer">
        <span className="status-indicator" aria-hidden="true" />

        <div>
          <strong>Local-first mode</strong>
          <small>Progress saved on this device</small>
        </div>
      </div>
    </aside>
  );
}
