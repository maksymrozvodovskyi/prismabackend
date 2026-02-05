export enum CacheNamespace {
  WORKLOGS = 'worklogs',
  USERS = 'users',
  PROJECTS = 'projects',
  AUTH = 'auth',
  FEEDBACKS = 'feedbacks'
}

export const CACHE_TTL = {
  WORKLOGS: 300,
  USERS: 600,
  PROJECTS: 600,
  USER_PROFILE: 300,
  AUTH: 60,
  FEEDBACK: 600, 
  FEEDBACKS: 600, 
} as const;
