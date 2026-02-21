import { addDays, format, parseISO } from "date-fns";
import { prisma } from "../../prisma";
import { cache, CacheKeys } from "../../lib/cache";
import {
  buildUserStatsMap,
  buildUserStatsMapFromWorklogs,
  computeCountsFromStats,
  type ReportsCountsResult,
  type Worklog,
} from "./stats";

export type { ReportsCountsResult };

export const getReportsCounts = async (
  date: string,
): Promise<ReportsCountsResult> => {
  const cacheKey = CacheKeys.reports.counts(date);

  return await cache.reports(cacheKey, async () => {
    const userStatsMap = await buildUserStatsMap(date);

    const allUserIds = (
      await prisma.user.findMany({ select: { id: true } })
    ).map((u) => u.id);

    return computeCountsFromStats(userStatsMap, allUserIds);
  });
};

export const getReportsCountsForRange = async (
  startDate: string,
  endDate: string,
): Promise<Record<string, ReportsCountsResult>> => {
  const cacheKey = CacheKeys.reports.countsRange(startDate, endDate);

  return await cache.reports(cacheKey, async () => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);

    const dates: string[] = [];
    for (let d = start; d <= end; d = addDays(d, 1)) {
      dates.push(format(d, "yyyy-MM-dd"));
    }

    const startOfRange = new Date(startDate + "T00:00:00.000Z");
    const endOfRange = new Date(endDate + "T23:59:59.999Z");

    const [allWorklogs, allUserIds] = await Promise.all([
      prisma.workLog.findMany({
        where: { date: { gte: startOfRange, lte: endOfRange } },
        select: { userId: true, hours: true, activity: true, date: true },
      }),
      prisma.user
        .findMany({ select: { id: true } })
        .then((u) => u.map((x) => x.id)),
    ]);

    const worklogsByDate = new Map<string, Worklog[]>();

    for (const log of allWorklogs) {
      const dateStr = format(log.date, "yyyy-MM-dd");
      const list = worklogsByDate.get(dateStr) ?? [];
      list.push(log);
      worklogsByDate.set(dateStr, list);
    }

    return Object.fromEntries(
      dates.map((dateStr) => {
        const dayWorklogs = worklogsByDate.get(dateStr) ?? [];
        const userStatsMap = buildUserStatsMapFromWorklogs(dayWorklogs);
        return [dateStr, computeCountsFromStats(userStatsMap, allUserIds)];
      }),
    ) as Record<string, ReportsCountsResult>;
  });
};
