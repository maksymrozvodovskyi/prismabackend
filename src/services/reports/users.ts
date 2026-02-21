import { createHash } from "crypto";
import { prisma } from "../../prisma";
import { cache, CacheKeys } from "../../lib/cache";
import { getVacationPeriodForDate } from "../../utils/vacation";
import {
  STRING_SORT_FIELDS,
  USER_REPORT_SELECT,
  matchesHoursFilter,
  type HoursFilterType,
} from "../../constants/reports.constants";
import { ActivityType } from "../../../prisma/generated/prisma/index";
import {
  buildUserStatsMap,
  getReportTypeUserIds,
  getSpecialTypeFromActivities,
  type ReportType,
  type UserStats,
} from "./stats";

export type { HoursFilterType };

type GetReportsUsersParams = {
  skip?: number;
  take?: number;
  sortOrder?: "asc" | "desc";
  sortField?: "name" | "email" | "createdAt" | "role" | "status";
  name?: string;
  date: string;
  activityTypes?: ActivityType[];
  hoursFilter?: HoursFilterType;
  reportType?: ReportType;
};

function toWhereClause(
  conditions: Record<string, unknown>,
): Record<string, unknown> | undefined {
  return Object.keys(conditions).length > 0 ? conditions : undefined;
}

function createReportsCacheKey(params: Record<string, unknown>): string {
  return createHash("sha256").update(JSON.stringify(params)).digest("hex");
}

async function attachStats<T extends { id: string }>(
  user: T,
  date: string,
  reportType: ReportType | undefined,
  userStatsMap: Map<string, UserStats>,
) {
  const stats = userStatsMap.get(user.id);
  const totalHours = stats?.totalHours ?? null;

  if (reportType !== "special" || !stats) {
    return { ...user, totalHours };
  }

  const specialType = getSpecialTypeFromActivities(stats.activities);

  if (specialType !== "VACATION") {
    return {
      ...user,
      totalHours,
      ...(specialType && { specialType }),
    };
  }

  const vacationPeriod = await getVacationPeriodForDate(user.id, date);

  return {
    ...user,
    totalHours,
    specialType,
    ...(vacationPeriod && { vacationPeriod }),
  };
}

async function getIdsByReportType(
  userStatsMap: Map<string, UserStats>,
  reportType: ReportType,
): Promise<string[] | null> {
  const allUserIds = (
    await prisma.user.findMany({ select: { id: true } })
  ).map((u) => u.id);

  const ids = getReportTypeUserIds(userStatsMap, allUserIds, reportType);
  return ids.length > 0 ? ids : null;
}

function getIdsByActivityAndHoursFilter(
  userStatsMap: Map<string, UserStats>,
  activityTypes: ActivityType[],
  hoursFilter: HoursFilterType | undefined,
): string[] | null {
  const ids = Array.from(userStatsMap.entries())
    .filter(([, stats]) => {
      if (
        activityTypes.length > 0 &&
        !activityTypes.some((a) => stats.activities.has(a))
      ) {
        return false;
      }
      if (hoursFilter && !matchesHoursFilter(stats.totalHours, hoursFilter)) {
        return false;
      }
      return true;
    })
    .map(([userId]) => userId);

  return ids.length > 0 ? ids : null;
}

async function resolveReportUserIds(
  userStatsMap: Map<string, UserStats>,
  params: GetReportsUsersParams & { activityTypes: ActivityType[] },
): Promise<string[] | null> {
  const { reportType, activityTypes, hoursFilter } = params;

  if (reportType) {
    return getIdsByReportType(userStatsMap, reportType);
  }

  const hasFilters = activityTypes.length > 0 || !!hoursFilter;
  if (hasFilters) {
    return getIdsByActivityAndHoursFilter(
      userStatsMap,
      activityTypes,
      hoursFilter,
    );
  }

  return null;
}

type FetchUsersParams = {
  whereClause: Record<string, unknown> | undefined;
  sortField: string;
  sortDirection: "asc" | "desc";
  skip: number;
  take: number;
  date: string;
  reportType?: ReportType;
};

async function fetchUsersWithStringSort(
  params: FetchUsersParams,
  userStatsMap: Map<string, UserStats>,
) {
  const {
    whereClause,
    sortField,
    sortDirection,
    skip,
    take,
    date,
    reportType,
  } = params;

  const allUsers = await prisma.user.findMany({
    where: whereClause,
    select: USER_REPORT_SELECT,
  });

  allUsers.sort((a, b) => {
    const aValue = String(a[sortField as keyof typeof a]).toLowerCase();
    const bValue = String(b[sortField as keyof typeof b]).toLowerCase();
    const comparison = aValue.localeCompare(bValue);
    return sortDirection === "asc" ? comparison : -comparison;
  });

  const paginatedUsers = allUsers.slice(skip, skip + take);

  const usersEnriched = await Promise.all(
    paginatedUsers.map((u) => attachStats(u, date, reportType, userStatsMap)),
  );

  const total = await prisma.user.count({ where: whereClause });

  return { users: usersEnriched, total };
}

async function fetchUsersWithDbSort(
  params: FetchUsersParams,
  userStatsMap: Map<string, UserStats>,
) {
  const { whereClause, sortField, sortDirection, skip, take, date, reportType } =
    params;

  const orderBy = {
    [sortField]: sortDirection,
  } as Record<string, "asc" | "desc">;

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      skip,
      take,
      ...(whereClause && { where: whereClause }),
      orderBy,
      select: USER_REPORT_SELECT,
    }),
    prisma.user.count({ ...(whereClause && { where: whereClause }) }),
  ]);

  const usersEnriched = await Promise.all(
    users.map((u) => attachStats(u, date, reportType, userStatsMap)),
  );

  return { users: usersEnriched, total };
}

export const getReportsUsers = async (params: GetReportsUsersParams) => {
  const {
    skip = 0,
    take = 20,
    sortOrder,
    sortField = "name",
    name,
    date,
    activityTypes,
    hoursFilter,
    reportType,
  } = params;

  const cacheParams = {
    skip,
    take,
    sortOrder: sortOrder ?? null,
    sortField,
    name: name ?? null,
    date,
    activityTypes: activityTypes ?? null,
    hoursFilter: hoursFilter ?? null,
    reportType: reportType ?? null,
  };

  const hash = createReportsCacheKey(cacheParams);
  const cacheKey = CacheKeys.reports.users(hash);

  return await cache.reports(cacheKey, async () => {
    const userStatsMap = await buildUserStatsMap(date);

    const reportUserIds = await resolveReportUserIds(userStatsMap, {
      ...params,
      activityTypes: activityTypes ?? [],
    });

    if (reportUserIds !== null && reportUserIds.length === 0) {
      return { users: [], total: 0 };
    }

    const whereConditions: Record<string, unknown> = {};
    if (reportUserIds !== null) whereConditions.id = { in: reportUserIds };
    if (name) whereConditions.name = { contains: name, mode: "insensitive" };

    const whereClause = toWhereClause(whereConditions);
    const sortDirection = sortOrder || "asc";

    const fetchParams: FetchUsersParams = {
      whereClause,
      sortField,
      sortDirection,
      skip,
      take,
      date,
      reportType,
    };

    const useStringSort = STRING_SORT_FIELDS.includes(
      sortField as (typeof STRING_SORT_FIELDS)[number],
    );

    if (useStringSort) {
      return fetchUsersWithStringSort(fetchParams, userStatsMap);
    }

    return fetchUsersWithDbSort(fetchParams, userStatsMap);
  });
};
