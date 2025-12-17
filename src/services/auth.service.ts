import { prisma } from "../prisma";
import bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import { LoginDto } from "../schemas/auth.scema";

const ACCESS_TOKEN_TTL = 1000 * 60 * 60;

export const login = async ({ email, password }: LoginDto) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  await prisma.session.deleteMany({
    where: { userId: user.id },
  });

  const accessToken = randomBytes(30).toString("base64");

  await prisma.session.create({
    data: {
      userId: user.id,
      accessToken,
      expiresAt: new Date(Date.now() + ACCESS_TOKEN_TTL),
    },
  });

  return {
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
};

export const logout = async (accessToken: string) => {
  await prisma.session.deleteMany({
    where: { accessToken },
  });
};

export const getMe = async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });
};
