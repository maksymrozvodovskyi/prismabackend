import { prisma } from "../../prisma";
import { ActivityType } from "../../../prisma/generated/prisma/index";

export type ReportType = "missed" | "work" | "special" | "overtime";

export type UserStats = { totalHours: number; activities: Set<ActivityType> };
export type SpecialType = "VACATION" | "SICKLEAVE";

export type Worklog = {
  userId: string;
  date: Date;
  hours: number;
  activity: ActivityType;
};

export type ReportsCountsResult = {
  missed: number;
  work: number;
  special: number;
  overtime: number;
};

const SPECIAL_ACTIVITIES: readonly ActivityType[] = [
  ActivityType.VACATION,
  ActivityType.SICKLEAVE,
];

const WORK_ACTIVITIES: readonly ActivityType[] = [
  ActivityType.CODING,
  ActivityType.REVIEW,
  ActivityType.STUDING,
];

export function getSpecialTypeFromActivities(
  activities: Set<ActivityType>,
): SpecialType | null {
  if (activities.has(ActivityType.VACATION)) return "VACATION";
  if (activities.has(ActivityType.SICKLEAVE)) return "SICKLEAVE";
  return null;
}

export function getReportTypeUserIds(
  userStatsMap: Map<string, UserStats>,
  allUserIds: string[],
  reportType: ReportType,
): string[] {
  if (reportType === "missed") {
    return allUserIds.filter((id) => !userStatsMap.has(id));
  }

  const entries = Array.from(userStatsMap.entries());

  switch (reportType) {
    case "work":
      return entries
        .filter(
          ([, s]) =>
            s.totalHours > 0 &&
            [...s.activities].every((a) => WORK_ACTIVITIES.includes(a)),
        )
        .map(([id]) => id);

    case "special":
      return entries
        .filter(([, s]) =>
          [...s.activities].some((a) => SPECIAL_ACTIVITIES.includes(a)),
        )
        .map(([id]) => id);

    case "overtime":
      return entries.filter(([, s]) => s.totalHours > 8).map(([id]) => id);
  }
}

export function computeCountsFromStats(
  userStatsMap: Map<string, UserStats>,
  allUserIds: string[],
): ReportsCountsResult {
  let work = 0;
  let special = 0;
  let overtime = 0;

  for (const [, stats] of userStatsMap.entries()) {
    if (
      stats.totalHours > 0 &&
      [...stats.activities].every((a) => WORK_ACTIVITIES.includes(a))
    ) {
      work++;
    }
    if ([...stats.activities].some((a) => SPECIAL_ACTIVITIES.includes(a))) {
      special++;
    }
    if (stats.totalHours > 8) {
      overtime++;
    }
  }

  const missed = allUserIds.length - userStatsMap.size;

  return { missed, work, special, overtime };
}

export async function buildUserStatsMap(
  date: string,
): Promise<Map<string, UserStats>> {
  const startOfDay = new Date(date + "T00:00:00.000Z");
  const endOfDay = new Date(date + "T23:59:59.999Z");

  const worklogs = await prisma.workLog.findMany({
    where: { date: { gte: startOfDay, lte: endOfDay } },
    select: { userId: true, hours: true, activity: true },
  });

  return buildUserStatsMapFromWorklogs(worklogs);
}

export function buildUserStatsMapFromWorklogs(
  worklogs: { userId: string; hours: number; activity: ActivityType }[],
): Map<string, UserStats> {
  const userStatsMap = new Map<string, UserStats>();

  for (const log of worklogs) {
    const existing = userStatsMap.get(log.userId);

    if (existing) {
      existing.totalHours += log.hours;
      existing.activities.add(log.activity);
    } else {
      userStatsMap.set(log.userId, {
        totalHours: log.hours,
        activities: new Set([log.activity]),
      });
    }
  }
  return userStatsMap;
}
