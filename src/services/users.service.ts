import { prisma } from "../prisma";
import { Role } from "@prisma/client";
import bcrypt from "bcrypt";

export type CreateUserInput = {
  email: string;
  password: string;
  name: string;
  role: Role;
};

export const createUser = async (data: CreateUserInput) => {
  const hashedPassword = await bcrypt.hash(data.password, 10);

  return prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      role: data.role,
      password: hashedPassword,
    },
  });
};

export const getUsers = () => {
  return prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });
};
