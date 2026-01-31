import { HttpError } from 'http-errors';
import { Request, Response, NextFunction } from "express";
import { Prisma } from "../../prisma/generated/prisma";
import { ZodError } from 'zod';

const PrismaClientKnownRequestError = Prisma.PrismaClientKnownRequestError;
const PrismaClientValidationError = Prisma.PrismaClientValidationError;

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error occurred:', {
    message: err.message,
    name: err.name,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  if (err instanceof HttpError) {
    return res.status(err.status).json({
      status: err.status,
      message: err.message,
      data: err
    });
  }

  if (err instanceof PrismaClientValidationError) {
    return res.status(400).json({
      status: 400,
      message: 'Validation error',
      error: 'Invalid data provided',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }

  if (err instanceof PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[]) || [];
      return res.status(409).json({
        status: 409,
        message: `Duplicate entry: ${target.join(', ')} already exists`,
        error: 'Conflict',
      });
    }

    if (err.code === 'P2003') {
      return res.status(400).json({
        status: 400,
        message: 'Invalid reference: related record does not exist',
        error: 'Foreign key constraint violation',
      });
    }

    if (err.code === 'P2025') {
      return res.status(404).json({
        status: 404,
        message: (err.meta?.cause as string) || 'Record not found',
        error: 'Not found',
      });
    }

    return res.status(400).json({
      status: 400,
      message: 'Database error',
      error: err.message,
      code: err.code,
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      status: 400,
      message: 'Validation error',
      errors: err.issues.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  return res.status(500).json({
    status: 500,
    message: 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message }),
  });
};