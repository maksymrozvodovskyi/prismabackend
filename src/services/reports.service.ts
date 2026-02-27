import type { Prisma } from "../../prisma/generated/prisma";
import { prisma } from "../prisma";
import { ActivityType } from "../../prisma/generated/prisma";
import { GetReportsFiltersDto } from "../schemas/reports.schema";
import { formatTotal, matchesHours } from "../utils";
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

  const activityFilter = activity || [];
  const hoursFilter = hours || [];

  let dateWhere: Prisma.DateTimeFilter<"WorkLog"> | Date | undefined;

  const isRange = !!(startDate && endDate);

  if (isRange) {
    dateWhere = { gte: startDate, lte: endDate };
  } else if (date) {
    dateWhere = date;
  } else {
    throw new Error("Need to pass either date or startDate + endDate");
  }

  const workLogsFilter = onlyWithoutReport
    ? { none: { date: dateWhere } }
    : {
        some: {
          date: dateWhere,
          ...(activityFilter.length
            ? { activity: { in: activityFilter } }
            : {}),
        },
      };

  const usersWithLogs = await prisma.user.findMany({
    where: {
      ...(name ? { name: { contains: name, mode: "insensitive" } } : {}),
      workLogs: workLogsFilter,
    },
    select: {
      id: true,
      name: true,
      workLogs: {
        where: {
          date: dateWhere,
          activity: activityFilter.length ? { in: activityFilter } : undefined,
        },
        orderBy: [{ date: "asc" }, { id: "asc" }],
        select: {
          date: true,
          hours: true,
          activity: true,
          project: { select: { name: true } },
        },
      },
    },
  });

  if (usersWithLogs.length === 0) {
    return {
      reports: [],
      activitiesByDate: {},
      total: 0,
      totalPages: 0,
      hasMore: false,
    };
  }

  const activitiesByDate: ActivitiesByDate = {};
  const unfilteredReports: Report[] = [];

  for (const user of usersWithLogs) {
    const userLogs = user.workLogs;

    if (isRange && userLogs.length === 0) continue;
    if (onlyWithoutReport && userLogs.length > 0) continue;

    let totalMinutes = 0;

    const projectsSet = new Set<string>();
    const userStatusesSet = new Set<Status>();

    for (const log of userLogs) {
      totalMinutes += Math.round((Number(log.hours) ?? 0) * 60);

      if (log.project?.name) {
        projectsSet.add(log.project.name);
      }

      if (log.activity) {
        userStatusesSet.add(log.activity);

        const dateKey = log.date.toISOString().split("T")[0];

        if (!activitiesByDate[dateKey]) {
          activitiesByDate[dateKey] = [];
        }

        if (!activitiesByDate[dateKey].includes(log.activity)) {
          activitiesByDate[dateKey].push(log.activity);
        }
      }
    }

    const projects = [...projectsSet].sort();

    const userStatuses = [...userStatusesSet].sort((a, b) =>
      a.localeCompare(b),
    );

    if (userStatuses.length === 0) {
      userStatuses.push("WITHOUT_REPORT");
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
      valueA = a.statuses.length ? a.statuses[0] : "WITHOUT_REPORT";
      valueB = b.statuses.length ? b.statuses[0] : "WITHOUT_REPORT";
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
  const totalPages = Math.ceil(total / take);

  const reports = filteredReports.slice(skip, skip + take);

  return {
    reports,
    activitiesByDate,
    total,
    totalPages,
    hasMore: skip + take < total,
    };
  });
};
