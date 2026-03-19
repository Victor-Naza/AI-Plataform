import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Agent, AgentPayload } from '../models/Agent';
import type { AuthUser } from '../models/Auth';
import { Header } from '../views/Header';
import { Sidebar } from '../views/Sidebar';
import { ChatWindow } from '../views/ChatWindow';
import { AuthScreen } from '../views/AuthScreen';
import { ProfileView } from '../views/ProfileView';
import { AgentsView } from '../views/AgentsView';
import { SettingsView } from '../views/SettingsView';
import { UserMenu } from '../views/UserMenu';
import { Conversation } from '../models/Conversation';
import { Message } from '../models/Message';
import type { LlmProviderId, LlmProviderOption } from '../models/LlmProvider';
import { chatService } from '../services/ChatService';
import { authService } from '../services/AuthService';
import { agentService } from '../services/AgentService';

type AppView = 'chat' | 'agents' | 'profile' | 'settings';

function getProviderById(
  providerOptions: LlmProviderOption[],
  providerId: LlmProviderId | ''
) {
  return providerOptions.find((provider) => provider.id === providerId);
}

function getResolvedModelId(
  provider: LlmProviderOption | undefined,
  requestedModelId: string
) {
  if (!provider) {
    return '';
  }

  if (provider.models.some((model) => model.id === requestedModelId)) {
    return requestedModelId;
  }

  return provider.defaultModelId ?? provider.models[0]?.id ?? '';
}

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
  const [selectedModelId, setSelectedModelId] = useState('');
  const [isProvidersLoading, setIsProvidersLoading] = useState(true);
  const [providersError, setProvidersError] = useState('');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [isAgentsLoading, setIsAgentsLoading] = useState(true);
  const selectedProviderIdRef = useRef<LlmProviderId | ''>('');

  const currentConversation = conversations.find(
    (conversation) => conversation.id === currentConversationId
  );
  const selectedProvider = providers.find((provider) => provider.id === selectedProviderId);
  const selectedAgent = agents.find((agent) => agent.id === selectedAgentId);
  const availableAgents = useMemo(
    () => agents.filter((agent) => agent.providerId === selectedProviderId),
    [agents, selectedProviderId]
  );

  useEffect(() => {
    selectedProviderIdRef.current = selectedProviderId;
  }, [selectedProviderId]);

  const resetUserState = useCallback(() => {
    setAuthenticatedUser(null);
    setActiveView('chat');
    setConversations([]);
    setCurrentConversationId(null);
    setIsSidebarOpen(false);
    setIsLoading(false);
    setProviders([]);
    setSelectedProviderId('');
    setSelectedModelId('');
    setIsProvidersLoading(false);
    setProvidersError('');
    setAgents([]);
    setSelectedAgentId('');
    setIsAgentsLoading(false);
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

    const loadChatConfiguration = async () => {
      if (!authenticatedUser) {
        setProviders([]);
        setSelectedProviderId('');
        setSelectedModelId('');
        setProvidersError('');
        setIsProvidersLoading(false);
        setAgents([]);
        setSelectedAgentId('');
        setIsAgentsLoading(false);
        return;
      }

      setIsProvidersLoading(true);
      setIsAgentsLoading(true);

      try {
        const [providersConfig, agentsResponse] = await Promise.all([
          chatService.getProviders(),
          agentService.getAgents(),
        ]);

        if (!isMounted) {
          return;
        }

        setProviders(providersConfig.providers);
        setAgents(agentsResponse);
        setProvidersError(
          providersConfig.providers.length === 0
            ? 'Configure OPENAI_API_KEY ou ANTHROPIC_API_KEY no .env.'
            : ''
        );
        const nextProviderId =
          selectedProviderIdRef.current &&
          providersConfig.providers.some(
            (provider) => provider.id === selectedProviderIdRef.current
          )
            ? selectedProviderIdRef.current
            : providersConfig.defaultProviderId ?? providersConfig.providers[0]?.id ?? '';
        const nextProvider = getProviderById(providersConfig.providers, nextProviderId);

        setSelectedProviderId(nextProviderId);
        setSelectedModelId((currentModelId) => getResolvedModelId(nextProvider, currentModelId));
      } catch (error) {
        console.error('Error loading app configuration:', error);

        if (!isMounted) {
          return;
        }

        if (error instanceof Error && error.message.toLowerCase().includes('sessao')) {
          handleUnauthorizedState();
          return;
        }

        setProviders([]);
        setSelectedProviderId('');
        setSelectedModelId('');
        setProvidersError('Nao foi possivel carregar os provedores. Verifique o backend local.');
        setAgents([]);
        setSelectedAgentId('');
      } finally {
        if (isMounted) {
          setIsProvidersLoading(false);
          setIsAgentsLoading(false);
        }
      }
    };

    loadChatConfiguration();

    return () => {
      isMounted = false;
    };
  }, [authenticatedUser, handleUnauthorizedState]);

  useEffect(() => {
    if (activeView !== 'chat') {
      setIsSidebarOpen(false);
    }
  }, [activeView]);

  useEffect(() => {
    if (!currentConversation) {
      return;
    }

    const nextProviderId =
      currentConversation.providerId &&
      providers.some((provider) => provider.id === currentConversation.providerId)
        ? currentConversation.providerId
        : selectedProviderId;
    const nextProvider = getProviderById(providers, nextProviderId);

    setSelectedProviderId(nextProviderId);
    setSelectedModelId(getResolvedModelId(nextProvider, currentConversation.modelId));
    setSelectedAgentId(
      currentConversation.agentId && agents.some((agent) => agent.id === currentConversation.agentId)
        ? currentConversation.agentId
        : ''
    );
  }, [agents, currentConversation, providers, selectedProviderId]);

  useEffect(() => {
    if (!providers.length) {
      if (selectedProviderId) {
        setSelectedProviderId('');
      }

      if (selectedModelId) {
        setSelectedModelId('');
      }

      return;
    }

    const resolvedProviderId = providers.some((provider) => provider.id === selectedProviderId)
      ? selectedProviderId
      : providers[0].id;
    const resolvedProvider = getProviderById(providers, resolvedProviderId);
    const resolvedModelId = getResolvedModelId(resolvedProvider, selectedModelId);

    if (resolvedProviderId !== selectedProviderId) {
      setSelectedProviderId(resolvedProviderId);
    }

    if (resolvedModelId !== selectedModelId) {
      setSelectedModelId(resolvedModelId);
    }
  }, [providers, selectedModelId, selectedProviderId]);

  useEffect(() => {
    if (selectedAgentId && !agents.some((agent) => agent.id === selectedAgentId)) {
      setSelectedAgentId('');
    }
  }, [agents, selectedAgentId]);

  useEffect(() => {
    if (!selectedAgentId || !selectedProviderId) {
      return;
    }

    const activeAgent = agents.find((agent) => agent.id === selectedAgentId);

    if (activeAgent && activeAgent.providerId !== selectedProviderId) {
      setSelectedAgentId('');
    }
  }, [agents, selectedAgentId, selectedProviderId]);

  const handleAuthenticatedSession = (user: AuthUser) => {
    setAuthenticatedUser(user);
    setActiveView('chat');
    setConversations([]);
    setCurrentConversationId(null);
    setProvidersError('');
    setAgents([]);
    setSelectedModelId('');
    setSelectedAgentId('');
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

  const syncConversationContext = useCallback(
    (providerId: LlmProviderId | '', modelId: string, agentId: string | null) => {
      if (!currentConversationId) {
        return;
      }

      setConversations((previousConversations) =>
        chatService.updateConversationContext(
          currentConversationId,
          { providerId, modelId, agentId },
          previousConversations
        )
      );
    },
    [currentConversationId]
  );

  const createConversation = (
    providerId: LlmProviderId | '',
    modelId: string,
    agentId: string | null,
    title?: string
  ) => {
    const newConversation = chatService.createConversation(title, {
      providerId,
      modelId,
      agentId,
    });
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
    createConversation(selectedProviderId, selectedModelId, selectedAgentId || null);
  };

  const handleProviderChange = (providerId: LlmProviderId) => {
    const nextProvider = getProviderById(providers, providerId);
    const nextAgentId =
      selectedAgent && selectedAgent.providerId !== providerId ? '' : selectedAgentId;
    const nextModelId = getResolvedModelId(nextProvider, selectedModelId);

    setSelectedProviderId(providerId);
    setSelectedModelId(nextModelId);
    setSelectedAgentId(nextAgentId);
    syncConversationContext(providerId, nextModelId, nextAgentId || null);
  };

  const handleModelChange = (modelId: string) => {
    setSelectedModelId(modelId);
    syncConversationContext(selectedProviderId, modelId, selectedAgentId || null);
  };

  const handleAgentChange = (agentId: string) => {
    const nextAgent = agents.find((agent) => agent.id === agentId);
    const nextProviderId = nextAgent?.providerId ?? selectedProviderId;
    const nextProvider = getProviderById(providers, nextProviderId);
    const nextModelId = getResolvedModelId(nextProvider, selectedModelId);

    setSelectedAgentId(agentId);

    if (nextAgent && nextAgent.providerId !== selectedProviderId) {
      setSelectedProviderId(nextAgent.providerId);
      setSelectedModelId(nextModelId);
    }

    syncConversationContext(nextProviderId, nextModelId, agentId || null);
  };

  const handleSendMessage = async (content: string) => {
    const conversationProviderId = currentConversation?.providerId || selectedProviderId;
    const conversationModelId = currentConversation?.modelId || selectedModelId;
    const conversationAgentId = currentConversation?.agentId ?? (selectedAgentId || null);
    const conversationAgent = agents.find((agent) => agent.id === conversationAgentId);

    if (!conversationProviderId || !conversationModelId) {
      return;
    }

    let conversationId = currentConversationId;
    let existingMessages = currentConversation?.messages ?? [];

    if (!conversationId) {
      const newConversation = createConversation(
        conversationProviderId,
        conversationModelId,
        conversationAgentId
      );
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
        provider: conversationProviderId,
        modelId: conversationModelId,
        instructions: conversationAgent?.systemPrompt,
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

  const handleCreateAgent = async (payload: AgentPayload) => {
    const createdAgent = await agentService.createAgent(payload);
    setAgents((previousAgents) => [createdAgent, ...previousAgents]);
  };

  const handleUpdateAgent = async (agentId: string, payload: AgentPayload) => {
    const updatedAgent = await agentService.updateAgent(agentId, payload);
    setAgents((previousAgents) =>
      previousAgents.map((agent) => (agent.id === agentId ? updatedAgent : agent))
    );
  };

  const handleDeleteAgent = async (agentId: string) => {
    await agentService.deleteAgent(agentId);
    setAgents((previousAgents) => previousAgents.filter((agent) => agent.id !== agentId));

    if (selectedAgentId === agentId) {
      setSelectedAgentId('');
    }

    setConversations((previousConversations) =>
      previousConversations.map((conversation) => {
        if (conversation.agentId !== agentId) {
          return conversation;
        }

        const updatedConversation = Conversation.from(conversation);
        updatedConversation.updateContext(
          updatedConversation.providerId,
          updatedConversation.modelId,
          null
        );
        return updatedConversation;
      })
    );
  };

  const handleUseAgent = (agentId: string) => {
    const agent = agents.find((candidate) => candidate.id === agentId);

    if (!agent) {
      return;
    }

    const nextProvider = getProviderById(providers, agent.providerId);
    const nextModelId = getResolvedModelId(nextProvider, selectedModelId);

    setSelectedProviderId(agent.providerId);
    setSelectedModelId(nextModelId);
    setSelectedAgentId(agent.id);
    syncConversationContext(agent.providerId, nextModelId, agent.id);
    setActiveView('chat');
  };

  const inputPlaceholder = providersError
    ? 'Configure um LLM no arquivo .env para conversar.'
    : isProvidersLoading
      ? 'Carregando provedores de LLM...'
      : !selectedProviderId
        ? 'Selecione um provedor para conversar.'
        : !selectedModelId
          ? 'Selecione uma versao do modelo para conversar.'
      : selectedAgent
          ? `Converse com ${selectedAgent.name}...`
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
        modelOptions={selectedProvider?.models ?? []}
        agentOptions={availableAgents}
        selectedProviderId={selectedProviderId}
        selectedModelId={selectedModelId}
        selectedAgentId={selectedAgentId}
        onProviderChange={handleProviderChange}
        onModelChange={handleModelChange}
        onAgentChange={handleAgentChange}
        isProvidersLoading={isProvidersLoading}
        isAgentsLoading={isAgentsLoading}
        providerError={providersError}
        activeView={activeView}
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
            footer={
              <UserMenu
                userName={authenticatedUser.name}
                userEmail={authenticatedUser.email}
                activeView={activeView}
                onViewChange={setActiveView}
                onLogout={handleLogout}
                mode="inline"
              />
            }
          />
        )}

        <div className="flex flex-1 flex-col overflow-hidden">
          <main className="flex flex-1 flex-col bg-app-bg">
            {activeView === 'profile' ? (
              <ProfileView user={authenticatedUser} />
            ) : activeView === 'settings' ? (
              <SettingsView user={authenticatedUser} />
            ) : activeView === 'agents' ? (
              <AgentsView
                agents={agents}
                providerOptions={providers}
                isLoading={isAgentsLoading}
                selectedAgentId={selectedAgentId}
                onCreateAgent={handleCreateAgent}
                onUpdateAgent={handleUpdateAgent}
                onDeleteAgent={handleDeleteAgent}
                onUseAgent={handleUseAgent}
                onBackToChat={() => setActiveView('chat')}
              />
            ) : (
              <ChatWindow
                messages={currentConversation?.messages ?? []}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                isInputDisabled={!selectedProviderId || !selectedModelId || isProvidersLoading}
                inputPlaceholder={inputPlaceholder}
              />
            )}
          </main>

          {activeView !== 'chat' && (
            <div className="border-t border-app-border bg-app-bg px-4 py-3 md:px-8">
              <div className="max-w-xs">
                <UserMenu
                  userName={authenticatedUser.name}
                  userEmail={authenticatedUser.email}
                  activeView={activeView}
                  onViewChange={setActiveView}
                  onLogout={handleLogout}
                  mode="inline"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AppController;
