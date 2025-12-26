import { Response, NextFunction } from "express";
import * as userService from "../services/users.service";
import { CreateUserDto, dateQuerySchema } from "../schemas/user.schema";
import { AuthRequest } from "../middlewares/auth";

export const createUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const dto = req.body as CreateUserDto;

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

    const { startDate, endDate } = dateQuerySchema.parse(req.query);

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return res
        .status(400)
        .json({ error: "startDate cannot be after endDate" });
    }

    const data = await userService.getUserDetails(userId, {
      startDate,
      endDate,
    });

    res.json(data);
  } catch (err) {
    next(err);
  }
};
