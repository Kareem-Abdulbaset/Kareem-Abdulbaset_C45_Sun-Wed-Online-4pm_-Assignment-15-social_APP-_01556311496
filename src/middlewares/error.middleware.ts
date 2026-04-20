import { ErrorRequestHandler } from "express";

export const errorMiddleware: ErrorRequestHandler = (error, req, res, next) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || "Something went wrong";

  if (error.code === 11000) {
    statusCode = 409;
    message = "Email already exists";
  }

  if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Please login again";
  }

  res.status(statusCode).json({
    success: false,
    message
  });
};
