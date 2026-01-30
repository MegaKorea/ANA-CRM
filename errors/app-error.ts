export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly statusCode: number = 500,
    message?: string
  ) {
    super(message || code);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
