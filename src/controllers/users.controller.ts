import { Request, Response, NextFunction } from "express";
import * as userService from "../services/users.service";
import { CreateUserDto } from "../schemas/user.schema";
import { AuthRequest } from "../middlewares/auth";

export const createUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await userService.createUser(req.body as CreateUserDto);
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
