import { CacheNamespace } from "./cache-constants";

export const makeSimpleKey = (
  prefix: string,
  ...params: (string | number)[]
) => {
  return `${prefix}:${params.join(":")}`;
};

export const CacheKeys = {
  worklogs: {
    byProject: (projectId: string, userId: string) =>
      makeSimpleKey(
        CacheNamespace.WORKLOGS,
        "byProject",
        projectId,
        "user",
        userId,
      ),
    listByUser: (userId: string) =>
      makeSimpleKey(CacheNamespace.WORKLOGS, "listByUser", userId),
    byUser: (userId: string, hash: string) =>
      makeSimpleKey(CacheNamespace.WORKLOGS, "byUser", userId, hash),
    pattern: {
      all: () => `${CacheNamespace.WORKLOGS}:*`,
      byUser: (userId: string) => `${CacheNamespace.WORKLOGS}:*user:${userId}*`,
      byProject: (projectId: string) =>
        `${CacheNamespace.WORKLOGS}:byProject:${projectId}:*`,
      userRelated: (userId: string) => `${CacheNamespace.WORKLOGS}:*${userId}*`,
    },
  },

  users: {
    list: (hash: string) => makeSimpleKey(CacheNamespace.USERS, "list", hash),
    profile: (userId: string) =>
      makeSimpleKey(CacheNamespace.USERS, "profile", userId),
    pattern: {
      all: () => `${CacheNamespace.USERS}:*`,
      list: () => `${CacheNamespace.USERS}:list:*`,
      profile: (userId: string) => `${CacheNamespace.USERS}:profile:${userId}`,
    },
  },

  projects: {
    byId: (projectId: string, userId: string) =>
      makeSimpleKey(CacheNamespace.PROJECTS, "byId", projectId, "user", userId),
    all: (hash: string) => makeSimpleKey(CacheNamespace.PROJECTS, "all", hash),
    byUser: (userId: string, hash: string) =>
      makeSimpleKey(CacheNamespace.PROJECTS, "byUser", userId, hash),
    pattern: {
      all: () => `${CacheNamespace.PROJECTS}:*`,
      byProject: (projectId: string) =>
        `${CacheNamespace.PROJECTS}:byId:${projectId}:*`,
      byUser: (userId: string) =>
        `${CacheNamespace.PROJECTS}:byUser:${userId}:*`,
    },
  },

  auth: {
    me: (userId: string) => makeSimpleKey(CacheNamespace.AUTH, "me", userId),
    pattern: {
      all: () => `${CacheNamespace.AUTH}:*`,
      user: (userId: string) => `${CacheNamespace.AUTH}:me:${userId}`,
    },
  },

  feedbacks: {
    byId: (id: string) => makeSimpleKey(CacheNamespace.FEEDBACKS, "byId", id),
    forUser: (userId: string, params?: any) => {
      const paramsStr = params ? `:${JSON.stringify(params)}` : "";
      return (
        makeSimpleKey(CacheNamespace.FEEDBACKS, "forUser", userId) + paramsStr
      );
    },
    pattern: {
      forUser: (userId: string) =>
        `${CacheNamespace.FEEDBACKS}:forUser:${userId}*`,
      all: () => `${CacheNamespace.FEEDBACKS}:*`,
    },
  },

  reports: {
    users: (hash: string) =>
      makeSimpleKey(CacheNamespace.REPORTS, "users", hash),
    counts: (date: string) =>
      makeSimpleKey(CacheNamespace.REPORTS, "counts", date),
    countsRange: (startDate: string, endDate: string) =>
      makeSimpleKey(CacheNamespace.REPORTS, "counts", `${startDate}_${endDate}`),
    pattern: {
      list: () => `${CacheNamespace.REPORTS}:*`,
    },
  },
} as const;
