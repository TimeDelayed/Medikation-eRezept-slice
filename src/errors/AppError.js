// errors/AppError.js
export class AppError extends Error {
  constructor(statusCode, message, options = {}) {
    super(message, options);
    this.statusCode = statusCode;
  }
}