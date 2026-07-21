export class AppError extends Error {
  constructor(statusCode, message, options = {}) {
    // Error only takes the cause and ignores the rest
    super(message, {
      cause: options.cause,
    });
    this.statusCode = statusCode;
    // Bind the options to the instance so that they can be accessed later
    Object.assign(this, options);
  }
}
