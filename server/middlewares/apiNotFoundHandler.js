import { httpError } from '../httpError.js';

export function apiNotFoundHandler(_request, _response, next) {
  next(httpError(404, 'Rota de API nao encontrada.'));
}
