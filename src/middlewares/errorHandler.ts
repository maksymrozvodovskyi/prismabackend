import { HttpError } from 'http-errors';
import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      status: err.status,
      message: err.name || err.message,
      data: err,
    });
  }

  return res.status(500).json({
    status: 500,
    message: 'Internal Server Error',
  });
};