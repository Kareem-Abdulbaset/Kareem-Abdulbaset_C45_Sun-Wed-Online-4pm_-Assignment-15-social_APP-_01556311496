import { ErrorRequestHandler } from "express";

export const errorMiddleware: ErrorRequestHandler = (error, req, res, next) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || "Something went wrong";
  let details = error.details;

  if (error.code === 11000) {
    statusCode = 409;
    message = "Email already exists";
  }

  if (error.name === "ValidationError") {
    statusCode = 400;
    message = "Validation failed";
    details = Object.values(error.errors || {}).map((item: any) => ({
      path: item.path,
      message: item.message
    }));
  }

  if (error.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${error.path}`;
  }

  if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Please login again";
  }

  const response: {
    success: boolean;
    message: string;
    errors?: unknown;
  } = {
    success: false,
    message
  };

  if (details !== undefined) {
    response.errors = details;
  }

  res.status(statusCode).json(response);
};
