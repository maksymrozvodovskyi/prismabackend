import { prisma } from "../prisma";
import bcrypt from "bcrypt";
import { getToken } from "../utils/jwt";
import { sendPasswordResetCode } from "./email.service";

export const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw new Error("Invalid credentials");
  }

  const accessToken = getToken({
    id: user.id,
    email: user.email,
    role: user.role,
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

const generateResetCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const cleanExpiredCodes = async () => {
  await prisma.passwordResetCode.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
};

export const forgotPassword = async (email: string) => {
  await cleanExpiredCodes();

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return { message: "If user exists, code sent to email" };
  }

  await prisma.passwordResetCode.updateMany({
    where: {
      userId: user.id,
      used: false,
    },
    data: {
      used: true,
    },
  });

  let code: string;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10;

  while (!isUnique && attempts < maxAttempts) {
    code = generateResetCode();
    const existing = await prisma.passwordResetCode.findFirst({
      where: {
        code,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!existing) {
      isUnique = true;
    } else {
      attempts++;
    }
  }

  if (!isUnique) {
    throw new Error("Failed to generate unique reset code");
  }

  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 15);

  await prisma.passwordResetCode.create({
    data: {
      userId: user.id,
      code: code!,
      expiresAt,
    },
  });

  try {
    await sendPasswordResetCode(email, code!);
  } catch (error) {
    await prisma.passwordResetCode.deleteMany({
      where: {
        userId: user.id,
        code: code!,
      },
    });
    throw error;
  }

  return { message: "If user exists, code sent to email" };
};

export const verifyResetCode = async (email: string, code: string) => {
  await cleanExpiredCodes();

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new Error("Invalid code");
  }

  const resetCode = await prisma.passwordResetCode.findFirst({
    where: {
      userId: user.id,
      used: false,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!resetCode) {
    throw new Error("Invalid code");
  }

  if (resetCode.code !== code) {
    throw new Error("Invalid code");
  }

  await prisma.passwordResetCode.update({
    where: { id: resetCode.id },
    data: { used: true },
  });

  const accessToken = getToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  return { accessToken };
};

export const resetPassword = async (userId: string, newPassword: string) => {
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return { message: "Password updated successfully" };
};
