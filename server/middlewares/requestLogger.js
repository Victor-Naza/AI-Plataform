export function requestLogger(request, response, next) {
  if (!request.path.startsWith('/api/')) {
    return next();
  }

  const startedAt = Date.now();

  response.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    console.log(
      `[${new Date().toISOString()}] ${request.method} ${request.originalUrl} ${response.statusCode} ${durationMs}ms`
    );
  });

  return next();
}
