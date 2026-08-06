interface ApplicationTopBarProps {
  currentDay: number;
}

export default function ApplicationTopBar({
  currentDay,
}: ApplicationTopBarProps) {
  return (
    <header className="application-top-bar">
      <div>
        <p className="application-context">HealthSprint workspace</p>
        <strong>Today&apos;s health dashboard</strong>
      </div>

      <div className="application-status">
        <span className="status-chip">
          <span className="status-indicator" aria-hidden="true" />
          Local data
        </span>

        <span className="status-chip">
          Day {currentDay} of 45
        </span>
      </div>
    </header>
  );
}
