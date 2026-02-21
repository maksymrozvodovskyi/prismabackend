export const STRING_SORT_FIELDS = ["name", "email", "status", "role"] as const;

export const USER_REPORT_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  status: true,
  skype: true,
  phoneNumber: true,
  dateOfBirth: true,
  location: true,
  skills: true,
  createdAt: true,
  projects: {
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      createdAt: true,
    },
  },
} as const;

export type HoursFilterType = "<8h" | "8h" | "8h>";

export function matchesHoursFilter(
  hours: number,
  filter: HoursFilterType,
): boolean {
  if (filter === "<8h") return hours < 8;
  if (filter === "8h") return hours >= 7.5 && hours <= 8.5;
  if (filter === "8h>") return hours > 8;
  return true;
}
