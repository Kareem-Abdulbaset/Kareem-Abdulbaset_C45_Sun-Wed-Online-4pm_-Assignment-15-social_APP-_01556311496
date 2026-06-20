export class AppError extends Error {
  statusCode: number;
  details?: unknown;
  isOperational: boolean;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
  }
}
