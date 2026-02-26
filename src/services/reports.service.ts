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

type Status = (typeof statuses)[number];

const statusRank: Record<Status, number> = {
  CODING: 0,
  REVIEW: 1,
  STUDING: 2,
  SICKLEAVE: 3,
  VACATION: 4,
  WITHOUT_REPORT: 5,
};

type Report = {
  userId: string;
  name: string;
  statuses: Status[];
  projects: string[];
  totalMinutes: number;
  total: string;
};

type ActivitiesByDate = Record<string, ActivityType[]>;

export const getReports = async (filters: GetReportsFiltersDto) => {
  const hash = createHash("sha256")
    .update(JSON.stringify(filters))
    .digest("hex");

  const cacheKey = CacheKeys.reports.list(hash);

  return await cache.reports(cacheKey, async () => {
    const {
      date,
      startDate,
      endDate,
      skip = 0,
      take = 20,
      sortField = "name",
      sortDirection = "asc",
      name,
      activity,
      hours,
      onlyWithoutReport = false,
    } = filters;

    const activityFilter = parseFilter(activity) as ActivityType[];
    const hoursFilter = parseFilter(hours);

    let dateWhere: Prisma.DateTimeFilter<"WorkLog"> | Date | undefined;

    if (startDate && endDate) {
      dateWhere = {
        gte: startDate,
        lte: endDate,
      };
    } else if (date) {
      dateWhere = date;
    } else {
      throw new Error("Need to pass either date or startDate + endDate");
    }

    const users = await prisma.user.findMany({
      where: name ? { name: { contains: name, mode: "insensitive" } } : {},
      select: { id: true, name: true },
    });

    if (users.length === 0) {
      return {
        reports: [],
        activitiesByDate: {},
        total: 0,
        totalPages: 0,
        hasMore: false,
      };
    }

    const userIds = users.map((user) => user.id);

    const logs = await prisma.workLog.findMany({
      where: {
        date: dateWhere,
        userId: { in: userIds },
        activity: activityFilter.length ? { in: activityFilter } : undefined,
      },
      orderBy: [{ date: "asc" }, { id: "asc" }],
      select: {
        userId: true,
        date: true,
        hours: true,
        activity: true,
        project: { select: { name: true } },
      },
    });

    type Log = (typeof logs)[number];

    const activitiesByDate: ActivitiesByDate = {};
    const logsByUser: Record<string, Log[]> = {};

    for (const log of logs) {
      if (!logsByUser[log.userId]) logsByUser[log.userId] = [];
      logsByUser[log.userId].push(log);

      if (log.hours && log.hours > 0 && log.activity) {
        const dateKey = log.date.toISOString().split("T")[0];
        if (!activitiesByDate[dateKey]) activitiesByDate[dateKey] = [];
        if (!activitiesByDate[dateKey].includes(log.activity)) {
          activitiesByDate[dateKey].push(log.activity);
        }
      }
    }

    const unfilteredReports: Report[] = [];

    for (const user of users) {
      const userLogs = logsByUser[user.id] || [];

      if (activityFilter.length > 0 && userLogs.length === 0) continue;
      if (onlyWithoutReport && userLogs.length > 0) continue;

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

      const userStatuses: Status[] = [];

      if (userLogs.length > 0) {
        for (const log of userLogs) {
          const act = log.activity;
          if (act && !userStatuses.includes(act)) {
            userStatuses.push(act);
          }
        }

        userStatuses.sort((a, b) => statusRank[a] - statusRank[b]);
      } else {
        userStatuses.push(statuses[statuses.length - 1]);
      }

      unfilteredReports.push({
        userId: user.id,
        name: user.name,
        statuses: userStatuses,
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

      if (sortField === "primaryStatus") {
        valueA = a.statuses.length
          ? statusRank[a.statuses[0]]
          : statuses.length;
        valueB = b.statuses.length
          ? statusRank[b.statuses[0]]
          : statuses.length;
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
      activitiesByDate,
      total,
      totalPages,
      hasMore: skip + take < total,
    };
  });
};
