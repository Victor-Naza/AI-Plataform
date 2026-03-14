import { useEffect, useState } from 'react';
import { Header } from '../views/Header';
import { Sidebar } from '../views/Sidebar';
import { ChatWindow } from '../views/ChatWindow';
import { Conversation } from '../models/Conversation';
import { Message } from '../models/Message';
import { LlmProviderId, LlmProviderOption } from '../models/LlmProvider';
import { chatService } from '../services/ChatService';

function AppController() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [providers, setProviders] = useState<LlmProviderOption[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<LlmProviderId | ''>('');
  const [isProvidersLoading, setIsProvidersLoading] = useState(true);
  const [providersError, setProvidersError] = useState('');

  const currentConversation = conversations.find(
    (conv) => conv.id === currentConversationId
  );
  const selectedProvider = providers.find((provider) => provider.id === selectedProviderId);

  useEffect(() => {
    let isMounted = true;

    const loadProviders = async () => {
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
  }, []);

  const createConversation = () => {
    const newConversation = chatService.createConversation();
    setConversations((prev) => [newConversation, ...prev]);
    setCurrentConversationId(newConversation.id);
    setIsSidebarOpen(false);
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

    setConversations((prev) =>
      chatService.addMessageToConversation(
        conversationId,
        userMessage,
        prev
      )
    );

    if (messageHistory.length === 1) {
      setConversations((prev) =>
        chatService.updateConversationTitle(
          conversationId,
          content.slice(0, 50),
          prev
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

      setConversations((prev) =>
        chatService.addMessageToConversation(
          conversationId,
          assistantMessage,
          prev
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const inputPlaceholder = providersError
    ? 'Configure um LLM no arquivo .env para conversar.'
    : isProvidersLoading
      ? 'Carregando provedores de LLM...'
      : 'Digite sua mensagem...';

  return (
    <div className="flex h-screen flex-col bg-app-bg text-app-text">
      <Header
        onMenuClick={() => setIsSidebarOpen(true)}
        providerOptions={providers}
        selectedProviderId={selectedProviderId}
        selectedProviderModel={selectedProvider?.model}
        onProviderChange={setSelectedProviderId}
        isProvidersLoading={isProvidersLoading}
        providerError={providersError}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          conversations={conversations}
          currentConversationId={currentConversationId}
          onNewChat={handleNewChat}
          onSelectConversation={setCurrentConversationId}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <main className="flex flex-1 flex-col bg-app-bg">
          {currentConversation ? (
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
                  Olá, como posso ajudar você hoje?
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
