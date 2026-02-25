import { Response, NextFunction } from "express";
import * as reportsService from "../services/reports.service";
import { GetReportsFiltersDto } from "../schemas/reports.schema";
import { AuthRequest } from "../middlewares/auth";

export const getReports = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const filters = res.locals.query as GetReportsFiltersDto;

    const result = await reportsService.getReports(filters);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};