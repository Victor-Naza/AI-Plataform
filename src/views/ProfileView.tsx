import {
  CalendarClock,
  Clock3,
  Mail,
  UserRound,
} from 'lucide-react';
import type { AuthUser } from '../models/Auth';

interface ProfileViewProps {
  user: AuthUser;
}

function formatDate(dateValue: string | null) {
  if (!dateValue) {
    return 'Ainda sem registro';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(dateValue));
}

export function ProfileView({ user }: ProfileViewProps) {
  return (
    <section className="flex-1 overflow-y-auto bg-app-bg px-4 py-6 md:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-3xl border border-app-border bg-app-surface p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/15 text-brand">
                <UserRound className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-app-text">{user.name}</h1>
                <p className="mt-1 text-app-muted">
                  Perfil disponivel para a conta autenticada no sistema.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-brand/20 bg-brand/10 px-4 py-3 text-sm text-brand">
              Sessao autenticada
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <article className="rounded-3xl border border-app-border bg-app-surface p-6">
            <Mail className="mb-4 h-6 w-6 text-brand" />
            <h2 className="text-sm font-semibold text-app-text">E-mail</h2>
            <p className="mt-2 break-all text-sm text-app-muted">{user.email}</p>
          </article>

          <article className="rounded-3xl border border-app-border bg-app-surface p-6">
            <CalendarClock className="mb-4 h-6 w-6 text-brand" />
            <h2 className="text-sm font-semibold text-app-text">Conta criada</h2>
            <p className="mt-2 text-sm text-app-muted">{formatDate(user.createdAt)}</p>
          </article>

          <article className="rounded-3xl border border-app-border bg-app-surface p-6">
            <Clock3 className="mb-4 h-6 w-6 text-brand" />
            <h2 className="text-sm font-semibold text-app-text">Ultimo login</h2>
            <p className="mt-2 text-sm text-app-muted">
              {formatDate(user.lastLoginAt)}
            </p>
          </article>
        </div>

        <article className="rounded-3xl border border-app-border bg-app-surface p-6">
          <h2 className="text-lg font-semibold text-app-text">Resumo do perfil</h2>
          <dl className="mt-6 space-y-4">
            <div className="flex flex-col gap-1 border-b border-app-border pb-4">
              <dt className="text-sm text-app-muted">Nome</dt>
              <dd className="text-base text-app-text">{user.name}</dd>
            </div>
            <div className="flex flex-col gap-1 border-b border-app-border pb-4">
              <dt className="text-sm text-app-muted">E-mail principal</dt>
              <dd className="text-base text-app-text">{user.email}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-sm text-app-muted">Atualizado em</dt>
              <dd className="text-base text-app-text">{formatDate(user.updatedAt)}</dd>
            </div>
          </dl>
        </article>
      </div>
    </section>
  );
}
