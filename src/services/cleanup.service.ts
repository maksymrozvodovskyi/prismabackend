import { prisma } from "../prisma";

export const cleanupExpiredResetCodes = async (): Promise<number> => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const result = await prisma.user.updateMany({
    where: {
      ot_code: {
        not: null,
      },
      updatedAt: {
        lt: sevenDaysAgo,
      },
    },
    data: {
      ot_code: null,
    },
  });

  return result.count;
};
