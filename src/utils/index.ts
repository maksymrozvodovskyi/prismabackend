export function formatTotal(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  return `${hours}:${minutes.toString().padStart(2, "0")}`;
}

const MINUTES_IN_8_HOURS = 480;

export const parseFilter = (value: any): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    return value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};

export function matchesHours(
  totalMinutes: number,
  hours?: ("LT_8" | "EQ_8" | "GT_8")[],
) {
  if (!hours || hours.length === 0) return true;

  return hours.some((hourFilter) => {
    if (hourFilter === "LT_8") return totalMinutes < MINUTES_IN_8_HOURS;
    if (hourFilter === "EQ_8") return totalMinutes === MINUTES_IN_8_HOURS;
    if (hourFilter === "GT_8") return totalMinutes > MINUTES_IN_8_HOURS;
    return false;
  });
}
