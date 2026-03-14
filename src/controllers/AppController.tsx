import { useCallback, useEffect, useState } from 'react';
import type { AuthUser } from '../models/Auth';
import { Header } from '../views/Header';
import { Sidebar } from '../views/Sidebar';
import { ChatWindow } from '../views/ChatWindow';
import { AuthScreen } from '../views/AuthScreen';
import { ProfileView } from '../views/ProfileView';
import { Conversation } from '../models/Conversation';
import { Message } from '../models/Message';
import { LlmProviderId, LlmProviderOption } from '../models/LlmProvider';
import { chatService } from '../services/ChatService';
import { authService } from '../services/AuthService';

type AppView = 'chat' | 'profile';

function AppController() {
  const [authenticatedUser, setAuthenticatedUser] = useState<AuthUser | null>(null);
  const [activeView, setActiveView] = useState<AppView>('chat');
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [providers, setProviders] = useState<LlmProviderOption[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<LlmProviderId | ''>('');
  const [isProvidersLoading, setIsProvidersLoading] = useState(true);
  const [providersError, setProvidersError] = useState('');

  const currentConversation = conversations.find(
    (conversation) => conversation.id === currentConversationId
  );
  const selectedProvider = providers.find((provider) => provider.id === selectedProviderId);

  const resetUserState = useCallback(() => {
    setAuthenticatedUser(null);
    setActiveView('chat');
    setConversations([]);
    setCurrentConversationId(null);
    setIsSidebarOpen(false);
    setIsLoading(false);
    setProviders([]);
    setSelectedProviderId('');
    setIsProvidersLoading(false);
    setProvidersError('');
  }, []);

  const handleUnauthorizedState = useCallback(() => {
    authService.clearSession();
    resetUserState();
  }, [resetUserState]);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      setIsAuthLoading(true);

      try {
        const restoredUser = await authService.restoreSession();

        if (isMounted) {
          setAuthenticatedUser(restoredUser);
        }
      } finally {
        if (isMounted) {
          setIsAuthLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadProviders = async () => {
      if (!authenticatedUser) {
        setProviders([]);
        setSelectedProviderId('');
        setProvidersError('');
        setIsProvidersLoading(false);
        return;
      }

      setIsProvidersLoading(true);

      try {
        const config = await chatService.getProviders();

        if (!isMounted) {
          return;
        }

        setProviders(config.providers);
        setProvidersError(
          config.providers.length === 0
            ? 'Configure OPENAI_API_KEY ou ANTHROPIC_API_KEY no .env.'
            : ''
        );
        setSelectedProviderId((current) => {
          if (current && config.providers.some((provider) => provider.id === current)) {
            return current;
          }

          return config.defaultProviderId ?? config.providers[0]?.id ?? '';
        });
      } catch (error) {
        console.error('Error loading providers:', error);

        if (!isMounted) {
          return;
        }

        if (error instanceof Error && error.message.toLowerCase().includes('sessao')) {
          handleUnauthorizedState();
          return;
        }

        setProviders([]);
        setSelectedProviderId('');
        setProvidersError('Nao foi possivel carregar os provedores. Verifique o backend local.');
      } finally {
        if (isMounted) {
          setIsProvidersLoading(false);
        }
      }
    };

    loadProviders();

    return () => {
      isMounted = false;
    };
  }, [authenticatedUser, handleUnauthorizedState]);

  useEffect(() => {
    if (activeView !== 'chat') {
      setIsSidebarOpen(false);
    }
  }, [activeView]);

  const handleAuthenticatedSession = (user: AuthUser) => {
    setAuthenticatedUser(user);
    setActiveView('chat');
    setConversations([]);
    setCurrentConversationId(null);
    setProvidersError('');
  };

  const handleLogin = async (credentials: { email: string; password: string }) => {
    setIsAuthSubmitting(true);

    try {
      const session = await authService.login(credentials);
      handleAuthenticatedSession(session.user);
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleRegister = async (payload: {
    name: string;
    email: string;
    password: string;
  }) => {
    setIsAuthSubmitting(true);

    try {
      const session = await authService.register(payload);
      handleAuthenticatedSession(session.user);
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setIsAuthSubmitting(true);

    try {
      await authService.logout();
    } finally {
      resetUserState();
      setIsAuthSubmitting(false);
    }
  };

  const createConversation = () => {
    const newConversation = chatService.createConversation();
    setConversations((previousConversations) => [
      newConversation,
      ...previousConversations,
    ]);
    setCurrentConversationId(newConversation.id);
    setIsSidebarOpen(false);
    setActiveView('chat');
    return newConversation;
  };

  const handleNewChat = () => {
    createConversation();
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedProviderId) {
      return;
    }

    let conversationId = currentConversationId;
    let existingMessages = currentConversation?.messages ?? [];

    if (!conversationId) {
      const newConversation = createConversation();
      conversationId = newConversation.id;
      existingMessages = [];
    }

    const userMessage = Message.createUserMessage(content);
    const messageHistory = [...existingMessages, userMessage];

    setConversations((previousConversations) =>
      chatService.addMessageToConversation(
        conversationId,
        userMessage,
        previousConversations
      )
    );

    if (messageHistory.length === 1) {
      setConversations((previousConversations) =>
        chatService.updateConversationTitle(
          conversationId,
          content.slice(0, 50),
          previousConversations
        )
      );
    }

    setIsLoading(true);

    try {
      const assistantResponse = await chatService.sendMessage({
        conversationId,
        provider: selectedProviderId,
        messages: messageHistory.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      });

      const assistantMessage = new Message(
        assistantResponse.id,
        assistantResponse.role as 'assistant',
        assistantResponse.content,
        assistantResponse.timestamp instanceof Date
          ? assistantResponse.timestamp
          : new Date(assistantResponse.timestamp)
      );

      setConversations((previousConversations) =>
        chatService.addMessageToConversation(
          conversationId,
          assistantMessage,
          previousConversations
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);

      if (error instanceof Error && error.message.toLowerCase().includes('sessao')) {
        handleUnauthorizedState();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const inputPlaceholder = providersError
    ? 'Configure um LLM no arquivo .env para conversar.'
    : isProvidersLoading
      ? 'Carregando provedores de LLM...'
      : 'Digite sua mensagem...';

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app-bg px-4 text-app-text">
        <div className="rounded-3xl border border-app-border bg-app-surface px-6 py-5 text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          <p className="text-sm text-app-muted">Validando sessao...</p>
        </div>
      </div>
    );
  }

  if (!authenticatedUser) {
    return (
      <AuthScreen
        onLogin={handleLogin}
        onRegister={handleRegister}
        isLoading={isAuthSubmitting}
      />
    );
  }

  return (
    <div className="flex h-screen flex-col bg-app-bg text-app-text">
      <Header
        onMenuClick={() => setIsSidebarOpen(true)}
        showMenuButton={activeView === 'chat'}
        providerOptions={providers}
        selectedProviderId={selectedProviderId}
        selectedProviderModel={selectedProvider?.model}
        onProviderChange={setSelectedProviderId}
        isProvidersLoading={isProvidersLoading}
        providerError={providersError}
        activeView={activeView}
        onViewChange={setActiveView}
        userName={authenticatedUser.name}
        userEmail={authenticatedUser.email}
        onLogout={handleLogout}
      />

      <div className="flex flex-1 overflow-hidden">
        {activeView === 'chat' && (
          <Sidebar
            conversations={conversations}
            currentConversationId={currentConversationId}
            onNewChat={handleNewChat}
            onSelectConversation={setCurrentConversationId}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
        )}

        <main className="flex flex-1 flex-col bg-app-bg">
          {activeView === 'profile' ? (
            <ProfileView user={authenticatedUser} />
          ) : currentConversation ? (
            <ChatWindow
              messages={currentConversation.messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              isInputDisabled={!selectedProviderId || isProvidersLoading}
              inputPlaceholder={inputPlaceholder}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <div className="space-y-4 px-4 text-center">
                <h2 className="text-2xl font-bold text-app-text">
                  Ola, como posso ajudar voce hoje?
                </h2>
                <button
                  onClick={handleNewChat}
                  className="rounded-lg bg-brand px-6 py-3 text-app-text transition-colors hover:bg-brand-hover"
                >
                  Nova Conversa
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default AppController;
