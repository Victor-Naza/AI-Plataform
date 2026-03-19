import { HttpError } from '../httpError.js';

export function errorHandler(error, request, response, next) {
  if (response.headersSent) {
    return next(error);
  }

  const statusCode = error instanceof HttpError ? error.statusCode : 500;
  const message =
    error instanceof Error ? error.message : 'Erro interno do servidor.';

  if (statusCode >= 500) {
    console.error(
      `[${new Date().toISOString()}] ${request.method} ${request.originalUrl}`,
      error
    );
  }

  return response.status(statusCode).json({ error: message });
}
