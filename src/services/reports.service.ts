import type { Prisma } from "../../prisma/generated/prisma";
import { prisma } from "../prisma";
import { ActivityType } from "../../prisma/generated/prisma";
import { GetReportsFiltersDto } from "../schemas/reports.schema";
import { formatTotal, matchesHours, parseFilter } from "../utils";
import { createHash } from "crypto";
import { cache, CacheKeys } from "../lib/cache";

const statuses = [
  "CODING",
  "REVIEW",
  "STUDING",
  "SICKLEAVE",
  "VACATION",
  "WITHOUT_REPORT",
] as const;

type Report = {
  userId: string;
  name: string;
  status: (typeof statuses)[number];
  projects: string[];
  totalMinutes: number;
  total: string;
};

export const getReports = async (filters: GetReportsFiltersDto) => {
  const hash = createHash("sha256")
    .update(JSON.stringify(filters))
    .digest("hex");

  const cacheKey = CacheKeys.reports.list(hash);

  return await cache.reports(cacheKey, async () => {
    const {
      date,
      skip = 0,
      take = 20,
      sortField = "name",
      sortDirection = "asc",
      name,
      activity,
      hours,
    } = filters;

    const activityFilter = parseFilter(activity) as ActivityType[];
    const hoursFilter = parseFilter(hours);

    const users = await prisma.user.findMany({
      where: name ? { name: { contains: name, mode: "insensitive" } } : {},
      select: { id: true, name: true },
    });

    if (users.length === 0) {
      return { reports: [], total: 0, totalPages: 0, hasMore: false };
    }

    const userIds = users.map((user) => user.id);

    const logs = await prisma.workLog.findMany({
      where: {
        date,
        userId: { in: userIds },
        activity: activityFilter.length ? { in: activityFilter } : undefined,
      },
      select: {
        userId: true,
        hours: true,
        activity: true,
        project: { select: { name: true } },
      },
    });

    type Log = (typeof logs)[number];

    const logsByUser: Record<string, Log[]> = {};

    for (const log of logs) {
      if (!logsByUser[log.userId]) {
        logsByUser[log.userId] = [];
      }
      logsByUser[log.userId].push(log);
    }

    const unfilteredReports: Report[] = [];

    for (const user of users) {
      const userLogs = logsByUser[user.id] || [];

      if (activityFilter.length > 0 && userLogs.length === 0) continue;

      let totalMinutes = 0;
      for (const log of userLogs) {
        totalMinutes += Math.round((log.hours ?? 0) * 60);
      }

      const projects: string[] = [];
      for (const log of userLogs) {
        const projectName = log.project?.name;
        if (projectName && !projects.includes(projectName)) {
          projects.push(projectName);
        }
      }
      projects.sort();

      const status =
        userLogs.length > 0 ? userLogs[0].activity : "WITHOUT_REPORT";

      unfilteredReports.push({
        userId: user.id,
        name: user.name,
        status,
        projects,
        totalMinutes,
        total: formatTotal(totalMinutes),
      });
    }

    const filteredReports = unfilteredReports.filter((report) =>
      matchesHours(
        report.totalMinutes,
        hoursFilter as ("LT_8" | "EQ_8" | "GT_8")[],
      ),
    );

    filteredReports.sort((a, b) => {
      let valueA: any;
      let valueB: any;

      if (sortField === "status") {
        valueA = statuses.indexOf(a.status);
        valueB = statuses.indexOf(b.status);
      } else if (sortField === "totalMinutes") {
        valueA = a.totalMinutes;
        valueB = b.totalMinutes;
      } else {
        valueA = a[sortField];
        valueB = b[sortField];
      }

      if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
      if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    const total = filteredReports.length;
    const reports = filteredReports.slice(skip, skip + take);
    const totalPages = Math.ceil(total / take);

    return {
      reports,
      total,
      totalPages,
      hasMore: skip + take < total,
    };
  });
};
