import { Response, NextFunction } from "express";
import {
  getReportsCounts as fetchReportsCounts,
  getReportsCountsForRange,
} from "../services/reports/counts";
import { getReportsUsers as fetchReportsUsers } from "../services/reports/users";
import {
  GetReportsUsersQueryDto,
  GetReportsCountsQueryDto,
} from "../schemas/reports.schema";
import { AuthRequest } from "../middlewares/auth";

export const getReportsUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const query = req.query as unknown as GetReportsUsersQueryDto;

    const result = await fetchReportsUsers({
      skip: query.skip,
      take: query.take,
      sortOrder: query.sortOrder,
      sortField: query.sortField,
      name: query.name,
      date: query.date,
      activityTypes: query.activityTypes,
      hoursFilter: query.hoursFilter,
      reportType: query.reportType,
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

export const getReportsCounts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const query = req.query as unknown as GetReportsCountsQueryDto;

    if ("startDate" in query && "endDate" in query) {
      const counts = await getReportsCountsForRange(
        query.startDate,
        query.endDate,
      );
      res.status(200).json(counts);
    } else {
      const counts = await fetchReportsCounts(query.date);
      res.status(200).json(counts);
    }
  } catch (err) {
    next(err);
  }
};
