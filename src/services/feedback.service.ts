import { prisma } from "../prisma";
import createHttpError from "http-errors";
import { cache, CacheKeys } from "../lib/cache";

export type CreateFeedbackInput = {
  authorId: string;
  targetUserId: string;
  content: string;
  taggedUsers: string[];
};

export type GetFeedbacksOptions = {
  skip?: number;
  take?: number;
};

const FEEDBACK_SELECT = {
  id: true,
  authorId: true,
  targetUserId: true,
  content: true,
  taggedUsers: true,
  author: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  targetUser: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  createdAt: true,
  updatedAt: true,
} as const;

const validateUsersExist = async (userIds: string[]) => {
  if (userIds.length === 0) return;
  
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true },
  });
  
  const foundIds = users.map(u => u.id);
  const missingIds = userIds.filter(id => !foundIds.includes(id));
  
  if (missingIds.length > 0) {
    throw createHttpError(404, `Users not found: ${missingIds.join(", ")}`);
  }
};

export const createFeedback = async (data: CreateFeedbackInput) => {
  await validateUsersExist([data.targetUserId, ...data.taggedUsers]);
  
  if (data.authorId === data.targetUserId) {
    throw createHttpError(400, "Cannot leave feedback for yourself");
  }
  
  if (data.taggedUsers.includes(data.authorId)) {
    throw createHttpError(400, "Cannot tag yourself");
  }
  
  if (data.taggedUsers.includes(data.targetUserId)) {
    throw createHttpError(400, "Cannot tag the target user");
  }

  const feedback = await prisma.feedback.create({
    data: {
      authorId: data.authorId,
      targetUserId: data.targetUserId,
      content: data.content,
      taggedUsers: data.taggedUsers,
    },
    select: FEEDBACK_SELECT,
  });

  await Promise.all([
    cache.invalidate(CacheKeys.users.pattern.list()),
    cache.invalidate(CacheKeys.users.profile(data.targetUserId)),
    cache.invalidate(CacheKeys.users.profile(data.authorId)),
    cache.invalidate(CacheKeys.feedbacks.pattern.forUser(data.targetUserId)),
    cache.invalidate(CacheKeys.feedbacks.pattern.forUser(data.authorId)),
    ...data.taggedUsers.map(userId => cache.invalidate(CacheKeys.feedbacks.pattern.forUser(userId))),
  ]);

  return feedback;
};


export const getMyFeedbacks = async (
  userId: string,
  {
    skip = 0,
    take = 20,
  }: GetFeedbacksOptions = {}
) => {
  const cacheKey = CacheKeys.feedbacks.forUser(userId, { skip, take, type: 'my' });

  return await cache.feedbacks(cacheKey, async () => {
    const [feedbacks, total] = await prisma.$transaction([
      prisma.feedback.findMany({
        where: {
          OR: [
            { authorId: userId }, 
            { targetUserId: userId },
            { taggedUsers: { has: userId } },
          ],
        },
        skip,
        take,
        orderBy: {
          createdAt: "desc",
        },
        select: FEEDBACK_SELECT,
      }),
      prisma.feedback.count({
        where: {
          OR: [
            { authorId: userId },
            { targetUserId: userId },
            { taggedUsers: { has: userId } },
          ],
        },
      }),
    ]);

    const hasNextPage = skip + feedbacks.length < total;

    return { feedbacks, total, hasNextPage };
  });
};

export const getFeedbackById = async (feedbackId: string) => {
  const cacheKey = CacheKeys.feedbacks.byId(feedbackId);

  return await cache.feedback(cacheKey, async () => {
    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
      select: FEEDBACK_SELECT,
    });

    if (!feedback) {
      throw createHttpError(404, "Feedback not found");
    }

    return feedback;
  });
};