// src/features/plan/components/Wizard/Stepper.tsx

type StepperProps = {
  steps: string[];        // 예: ["기본정보","예산","거점","이동수단","초기 스팟"]
  current: number;        // 0-based
};

export default function Stepper({ steps, current }: StepperProps) {
  const now = Math.min(Math.max(current + 1, 1), steps.length);

  return (
    <div
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={steps.length}
      aria-valuenow={now}
      aria-valuetext={`${steps[current] ?? steps[0]}`}
      className="select-none"
    >
      <ol className="flex items-center gap-2">
        {steps.map((label, idx) => {
          const active = idx <= current;
          return (
            <li key={label} className="flex items-center gap-2">
              <span
                className={[
                  "inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs",
                  active
                    ? "border-gray-900 bg-gray-900 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900"
                    : "border-gray-300 text-gray-500 dark:border-gray-700 dark:text-gray-400",
                ].join(" ")}
                aria-current={idx === current ? "step" : undefined}
              >
                {idx + 1}
              </span>
              <span
                className={[
                  "hidden text-xs font-medium sm:inline",
                  active ? "text-gray-900 dark:text-gray-100" : "text-gray-500 dark:text-gray-400",
                ].join(" ")}
              >
                {label}
              </span>
              {idx < steps.length - 1 && (
                <span className="mx-1 h-px w-6 bg-gray-300 dark:bg-gray-700" aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
