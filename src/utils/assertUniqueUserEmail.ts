import { prisma } from "../prisma";

export const assertUniqueUserEmail = async (email: string) => {
  const exists = await prisma.user.findUnique({
    where: { email },
  });

  if (exists) throw new Error("User already exists");
};
