import { Bell, Paintbrush, Shield, UserRound } from 'lucide-react';
import type { AuthUser } from '../models/Auth';

interface SettingsViewProps {
  user: AuthUser;
}

export function SettingsView({ user }: SettingsViewProps) {
  return (
    <section className="flex-1 overflow-y-auto bg-app-bg px-4 py-6 md:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-3xl border border-app-border bg-app-surface p-8">
          <h1 className="text-3xl font-bold text-app-text">Configuracoes</h1>
          <p className="mt-2 text-app-muted">
            Area de conta e preferencias do usuario autenticado.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <article className="rounded-3xl border border-app-border bg-app-surface p-6">
            <UserRound className="mb-4 h-6 w-6 text-brand" />
            <h2 className="text-sm font-semibold text-app-text">Conta</h2>
            <p className="mt-2 text-sm text-app-muted">
              Nome e e-mail usados na autenticacao.
            </p>
            <p className="mt-4 text-sm text-app-text">{user.name}</p>
            <p className="text-sm text-app-muted">{user.email}</p>
          </article>

          <article className="rounded-3xl border border-app-border bg-app-surface p-6">
            <Shield className="mb-4 h-6 w-6 text-brand" />
            <h2 className="text-sm font-semibold text-app-text">Seguranca</h2>
            <p className="mt-2 text-sm text-app-muted">
              Sessao protegida por autenticacao e rotas privadas.
            </p>
          </article>

          <article className="rounded-3xl border border-app-border bg-app-surface p-6">
            <Paintbrush className="mb-4 h-6 w-6 text-brand" />
            <h2 className="text-sm font-semibold text-app-text">Interface</h2>
            <p className="mt-2 text-sm text-app-muted">
              Este espaco pode receber preferencias visuais e comportamento do app.
            </p>
          </article>
        </div>

        <article className="rounded-3xl border border-app-border bg-app-surface p-6">
          <div className="flex items-start gap-4">
            <Bell className="mt-1 h-5 w-5 text-brand" />
            <div>
              <h2 className="text-lg font-semibold text-app-text">Proximos ajustes</h2>
              <p className="mt-2 text-sm leading-6 text-app-muted">
                Se voce quiser, no proximo passo eu posso transformar esta area em
                configuracoes reais de notificacao, preferencias do chat, avatar e
                dados da conta.
              </p>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
