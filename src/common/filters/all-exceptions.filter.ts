import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import { Response } from "express";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(error: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    let statusCode = error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;
    let message = error.message || "Something went wrong";
    let details = error.details;

    if (error instanceof HttpException) {
      statusCode = error.getStatus();
      const errorResponse = error.getResponse();

      if (typeof errorResponse === "string") {
        message = errorResponse;
      } else if (errorResponse && typeof errorResponse === "object") {
        const responseBody = errorResponse as Record<string, unknown>;
        const responseMessage = responseBody.message;

        if (Array.isArray(responseMessage)) {
          message = "Validation failed";
          details = responseMessage;
        } else if (typeof responseMessage === "string") {
          message = responseMessage;
        }
      }
    }

    if (error.code === 11000) {
      statusCode = HttpStatus.CONFLICT;
      message = "Email already exists";
    }

    if (error.name === "ValidationError") {
      statusCode = HttpStatus.BAD_REQUEST;
      message = "Validation failed";
      details = Object.values(error.errors || {}).map((item: any) => ({
        path: item.path,
        message: item.message
      }));
    }

    if (error.name === "CastError") {
      statusCode = HttpStatus.BAD_REQUEST;
      message = `Invalid ${error.path}`;
    }

    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      statusCode = HttpStatus.UNAUTHORIZED;
      message = "Please login again";
    }

    const body: {
      success: false;
      message: string;
      errors?: unknown;
    } = {
      success: false,
      message
    };

    if (details !== undefined) {
      body.errors = details;
    }

    response.status(statusCode).json(body);
  }
}
