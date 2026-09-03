export class ApiError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = "Bad request", details?: unknown) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = "Unauthorized", details?: unknown) {
    return new ApiError(401, message, details);
  }

  static forbidden(message = "Forbidden", details?: unknown) {
    return new ApiError(403, message, details);
  }

  static notFound(message = "Not found", details?: unknown) {
    return new ApiError(404, message, details);
  }

  static conflict(message = "Conflict", details?: unknown) {
    return new ApiError(409, message, details);
  }

    static tooMany(message: string) {
    return new ApiError(429, message);
  }
}