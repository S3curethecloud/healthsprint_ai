interface DailyOverviewProps {
  currentDay: number;
  calorieTarget: number;
  caloriesConsumed: number;
  caloriesRemaining: number;
  calorieProgress: number;
  programProgress: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  onCurrentDayChange: (day: number) => void;
}

function scrollToSection(targetId: string) {
  const target = document.getElementById(targetId);

  if (!target) {
    return;
  }

  const desktopOffset = window.innerWidth >= 1100 ? 104 : 84;
  const targetTop =
    target.getBoundingClientRect().top +
    window.scrollY -
    desktopOffset;

  window.scrollTo({
    top: Math.max(0, targetTop),
    behavior: "smooth",
  });
}

export default function DailyOverview({
  currentDay,
  calorieTarget,
  caloriesConsumed,
  caloriesRemaining,
  calorieProgress,
  programProgress,
  protein,
  carbohydrates,
  fat,
  onCurrentDayChange,
}: DailyOverviewProps) {
  const calorieStatus =
    caloriesRemaining >= 0
      ? `${caloriesRemaining} kcal available`
      : `${Math.abs(caloriesRemaining)} kcal above target`;

  return (
    <section
      className="daily-overview"
      id="progress"
      aria-labelledby="daily-overview-title"
    >
      <div className="daily-overview-heading">
        <div>
          <p className="eyebrow">Daily overview</p>
          <h2 id="daily-overview-title">
            Your Day {currentDay} health summary
          </h2>
          <p>
            Review today&apos;s nutrition position, then continue with
            meals or activity.
          </p>
        </div>

        <label className="compact-field overview-day-field">
          Program day
          <input
            type="number"
            min="1"
            max="45"
            value={currentDay}
            onChange={(event) =>
              onCurrentDayChange(
                Math.min(
                  45,
                  Math.max(1, Number(event.target.value) || 1),
                ),
              )
            }
          />
        </label>
      </div>

      <div className="daily-overview-grid">
        <article className="calorie-overview-card">
          <div className="calorie-overview-header">
            <div>
              <span>Calories consumed</span>
              <strong>{caloriesConsumed}</strong>
              <small>of {calorieTarget} kcal</small>
            </div>

            <div className="calorie-remaining">
              <span>Remaining</span>
              <strong className={caloriesRemaining < 0 ? "danger" : ""}>
                {caloriesRemaining}
              </strong>
              <small>{calorieStatus}</small>
            </div>
          </div>

          <div
            className="progress-track"
            aria-label={`${Math.round(calorieProgress)} percent of calorie target consumed`}
          >
            <div
              className="progress-fill"
              style={{ width: `${calorieProgress}%` }}
            />
          </div>
        </article>

        <article className="macro-overview-card">
          <div>
            <span>Protein</span>
            <strong>{protein} g</strong>
            <small>Muscle support</small>
          </div>

          <div>
            <span>Carbohydrates</span>
            <strong>{carbohydrates} g</strong>
            <small>Daily fuel</small>
          </div>

          <div>
            <span>Fat</span>
            <strong>{fat} g</strong>
            <small>Daily total</small>
          </div>
        </article>

        <article className="program-overview-card">
          <div className="program-overview-copy">
            <span>45-day program</span>
            <strong>Day {currentDay} of 45</strong>
            <small>{Math.round(programProgress)}% complete</small>
          </div>

          <div
            className="progress-track"
            aria-label={`${Math.round(programProgress)} percent of program completed`}
          >
            <div
              className="progress-fill"
              style={{ width: `${programProgress}%` }}
            />
          </div>

          <div className="daily-primary-actions">
            <button
              type="button"
              className="primary-button"
              onClick={() => scrollToSection("meals")}
            >
              Log today&apos;s meals
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={() => scrollToSection("activity")}
            >
              Update activity
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}
