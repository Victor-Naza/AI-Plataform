export class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
  }
}

export function httpError(statusCode, message) {
  return new HttpError(statusCode, message);
}
