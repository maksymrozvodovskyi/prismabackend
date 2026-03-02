import { Request, Response, NextFunction } from "express";
import { getVacations } from "../services/vacations.service";
import { getVacationsQuerySchema } from "../schemas/vacations.schema";

export const getVacationsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const query = getVacationsQuerySchema.parse(req.query);
    const result = await getVacations(query);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
