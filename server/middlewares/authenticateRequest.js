import {
  findSessionByToken,
  pruneExpiredSessions,
  readAuthStore,
  writeAuthStore,
} from '../authStore.js';
import { httpError } from '../httpError.js';

function extractBearerToken(authorizationHeader) {
  if (typeof authorizationHeader !== 'string') {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
}

export async function authenticateRequest(request, _response, next) {
  try {
    const token = extractBearerToken(request.headers.authorization);

    if (!token) {
      return next(httpError(401, 'Sessao invalida ou ausente.'));
    }

    const store = await readAuthStore();
    const storeChanged = pruneExpiredSessions(store);
    const session = findSessionByToken(store, token);

    if (storeChanged) {
      await writeAuthStore(store);
    }

    if (!session) {
      return next(httpError(401, 'Sessao expirada ou invalida.'));
    }

    const user = store.users.find((candidate) => candidate.id === session.userId);

    if (!user) {
      return next(httpError(401, 'Usuario da sessao nao encontrado.'));
    }

    request.auth = { token, session, user };
    return next();
  } catch (error) {
    return next(error);
  }
}
