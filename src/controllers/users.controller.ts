import { Response, NextFunction } from "express";
import * as userService from "../services/users.service";
import { CreateUserDto } from "../schemas/user.schema";
import { AuthRequest } from "../middlewares/auth";
import { assertUniqueUserEmail } from "../utils/assertUniqueUserEmail";

export const createUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const dto = req.body as CreateUserDto;

    await assertUniqueUserEmail(dto.email);

    const user = await userService.createUser(dto);

    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
};

export const getUsers = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const users = await userService.getUsers();
    res.json(users);
  } catch (err) {
    next(err);
  }
};

export const getUserDetails = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    const data = await userService.getUserDetails(userId, {
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
    });

    res.json(data);
  } catch (err) {
    next(err);
  }
};
