import { prisma } from "../prisma";
import bcrypt from "bcrypt";
import { getToken, getResetToken } from "../utils/jwt";
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

export const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new Error("User not found");
  }

  const code = generateResetCode();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      ot_code: code,
    },
  });

  try {
    await sendPasswordResetCode(email, code);
  } catch (error) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        ot_code: null,
      },
    });
    throw error;
  }

  return { message: "Code sent to email" };
};

export const verifyResetCode = async (email: string, code: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new Error("User not found");
  }

  if (!user.ot_code) {
    throw new Error("No reset code found for this user");
  }

  if (user.ot_code !== code) {
    throw new Error("Invalid code");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      ot_code: null,
    },
  });

  const resetToken = getResetToken(user.id);

  return { resetToken };
};

export const resetPassword = async (userId: string, newPassword: string) => {
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
      ot_code: null,
    },
  });

  return { message: "Password updated successfully" };
};
