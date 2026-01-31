import { Response, NextFunction } from "express";
import * as userService from "../services/users.service";
import {
  CreateUserDto,
  dateQuerySchema,
  getUsersQuerySchema,
  GetUsersQueryDto,
} from "../schemas/user.schema";
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
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const query = getUsersQuerySchema.parse(req.query) as any;
    const result = await userService.getUsers({
      skip: query.skip,
      take: query.take,
      sortOrder: query.sortOrder,
      sortField: query.sortField,
      name: query.name,
      role: query.userType,
      status: query.status,
    });
    
    const skip = query.skip || 0;
    const hasMore = skip + result.users.length < result.total;
    const nextSkip = hasMore ? skip + result.users.length : undefined;
    
    res.status(200).json({
      data: result.users,
      total: result.total,
      hasMore,
      nextSkip,
    });
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

    const data = await userService.getUserProfile(userId);

    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

export const getUserProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const user = await userService.getUserProfile(userId);
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};
