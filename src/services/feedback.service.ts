import { prisma } from "../prisma";
import type { Prisma } from "../../prisma/generated/prisma";
import createHttpError from "http-errors";
import { cache, CacheKeys } from "../lib/cache";
import { subDays } from "date-fns";

export type CreateFeedbackInput = {
  authorId: string;
  targetUserId: string;
  content: string;
  taggedUsers: string[];
};

export type GetFeedbacksOptions = {
  skip?: number;
  take?: number;
  sortBy?: "createdAt";
  sortOrder?: "asc" | "desc";
  search?: string;
  period?: "7days" | "30days";
};

type TaggedUserDetail = { id: string; name: string };

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

const fetchTaggedUsersDetails = async (
  taggedUsers: string[],
): Promise<TaggedUserDetail[]> => {
  if (taggedUsers.length === 0) return [];

  const users = await prisma.user.findMany({
    where: { id: { in: taggedUsers } },
    select: { id: true, name: true },
  });
  return users;
};

const fetchAllTaggedUsersDetails = async (
  userIds: string[],
): Promise<Record<string, TaggedUserDetail>> => {
  if (userIds.length === 0) return {};

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true },
  });

  const lookup: Record<string, TaggedUserDetail> = {};
  for (const user of users) {
    lookup[user.id] = user;
  }
  return lookup;
};

const validateUsersExist = async (userIds: string[]) => {
  if (userIds.length === 0) return;

  const existingUsers = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true },
  });

  const existingIds = existingUsers.map((u) => u.id);
  const missingIds = userIds.filter((id) => !existingIds.includes(id));

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

  const taggedUsersDetails = await fetchTaggedUsersDetails(
    feedback.taggedUsers,
  );

  const { taggedUsers: _taggedUsers, ...feedbackWithoutTaggedIds } = feedback;
  const result = { ...feedbackWithoutTaggedIds, taggedUsersDetails };

  const cacheKeysToInvalidate = [
    CacheKeys.users.pattern.list(),
    CacheKeys.users.profile(data.targetUserId),
    CacheKeys.users.profile(data.authorId),
    CacheKeys.feedbacks.pattern.forUser(data.targetUserId),
    CacheKeys.feedbacks.pattern.forUser(data.authorId),
  ];
  for (const taggedUserId of data.taggedUsers) {
    cacheKeysToInvalidate.push(
      CacheKeys.feedbacks.pattern.forUser(taggedUserId),
    );
  }
  await Promise.all(cacheKeysToInvalidate.map((key) => cache.invalidate(key)));

  return result;
};

export const getMyFeedbacks = async (
  userId: string,
  {
    skip = 0,
    take = 20,
    sortBy = "createdAt",
    sortOrder = "desc",
    search,
    period,
  }: GetFeedbacksOptions = {},
) => {
  const cacheKey = CacheKeys.feedbacks.forUser(userId, {
    skip,
    take,
    sortBy,
    sortOrder,
    search,
    period,
    type: "my",
  });

  return await cache.feedbacks(cacheKey, async () => {
    const userFilter = {
      OR: [
        { authorId: userId },
        { targetUserId: userId },
        { taggedUsers: { has: userId } },
      ],
    };

    const searchFilter = search
      ? {
          OR: [
            { content: { contains: search, mode: "insensitive" as const } },
            {
              author: {
                name: { contains: search, mode: "insensitive" as const },
              },
            },
            {
              targetUser: {
                name: { contains: search, mode: "insensitive" as const },
              },
            },
          ],
        }
      : undefined;

    const periodFilter = period
      ? {
          createdAt: {
            gte: subDays(new Date(), period === "7days" ? 7 : 30),
          },
        }
      : undefined;

    const whereConditions: Prisma.FeedbackWhereInput[] = [userFilter];
    if (searchFilter) whereConditions.push(searchFilter);
    if (periodFilter) whereConditions.push(periodFilter);

    const where = { AND: whereConditions };

    const sortByField = sortBy ?? "createdAt";
    const sortOrderValue = sortOrder ?? "desc";
    const orderByConfig = { [sortByField]: sortOrderValue };

    const [feedbacks, total] = await prisma.$transaction([
      prisma.feedback.findMany({
        where,
        skip,
        take,
        orderBy: orderByConfig,
        select: FEEDBACK_SELECT,
      }),
      prisma.feedback.count({ where }),
    ]);

    const allTaggedUserIds: string[] = [];

    for (const feedback of feedbacks) {
      for (const taggedId of feedback.taggedUsers) {
        if (!allTaggedUserIds.includes(taggedId)) {
          allTaggedUserIds.push(taggedId);
        }
      }
    }

    const taggedUsersMap = await fetchAllTaggedUsersDetails(allTaggedUserIds);

    const feedbacksWithDetails = feedbacks.map((f) => {
      const taggedUsersDetails: TaggedUserDetail[] = [];
      for (const id of f.taggedUsers) {
        const user = taggedUsersMap[id];
        if (user) {
          taggedUsersDetails.push(user);
        }
      }
      const { taggedUsers: _taggedUsers, ...rest } = f;
      return { ...rest, taggedUsersDetails };
    });

    const hasNextPage = skip + feedbacks.length < total;

    return { feedbacks: feedbacksWithDetails, total, hasNextPage };
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

    const taggedUsersDetails = await fetchTaggedUsersDetails(
      feedback.taggedUsers,
    );
    const { taggedUsers: _taggedUsers, ...rest } = feedback;
    return { ...rest, taggedUsersDetails };
  });
};

export const deleteFeedback = async (feedbackId: string, userId: string) => {
  const feedback = await prisma.feedback.findUnique({
    where: { id: feedbackId },
    select: {
      id: true,
      authorId: true,
      targetUserId: true,
      taggedUsers: true,
    },
  });

  if (!feedback) {
    throw createHttpError(404, "Feedback not found");
  }

  if (feedback.authorId !== userId) {
    throw createHttpError(403, "You can only delete your own feedback");
  }

  await prisma.feedback.delete({
    where: { id: feedbackId },
  });

  const cacheKeysToInvalidate = [
    CacheKeys.feedbacks.byId(feedbackId),
    CacheKeys.feedbacks.pattern.forUser(feedback.targetUserId),
    CacheKeys.feedbacks.pattern.forUser(feedback.authorId),
  ];
  for (const taggedUserId of feedback.taggedUsers) {
    cacheKeysToInvalidate.push(
      CacheKeys.feedbacks.pattern.forUser(taggedUserId),
    );
  }
  await Promise.all(cacheKeysToInvalidate.map((key) => cache.invalidate(key)));

  return { success: true };
};
