import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  createSession,
  findUserByEmail,
  hashPassword,
  normalizeEmail,
  passwordMeetsRequirements,
  pruneExpiredSessions,
  readAuthStore,
  removeSessionByToken,
  sanitizeUser,
  verifyPassword,
  writeAuthStore,
} from './authStore.js';
import {
  createAgent,
  readAgentStore,
  sanitizeAgent,
  writeAgentStore,
} from './agentStore.js';
import { authenticateRequest } from './middlewares/authenticateRequest.js';
import { requestLogger } from './middlewares/requestLogger.js';
import { securityHeaders } from './middlewares/securityHeaders.js';
import { apiNotFoundHandler } from './middlewares/apiNotFoundHandler.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { httpError } from './httpError.js';
import { asyncHandler } from './utils/asyncHandler.js';

const app = express();
const port = Number(process.env.PORT || 3001);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');
const distIndexPath = path.join(distDir, 'index.html');
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const modelCacheTtlMs = 5 * 60 * 1000;
const providerModelsCache = new Map();

app.use(requestLogger);
app.use(securityHeaders);
app.use(express.json({ limit: '1mb' }));

const providerCatalog = {
  openai: {
    id: 'openai',
    label: 'GPT',
    apiKey: process.env.OPENAI_API_KEY,
    defaultModelId: process.env.OPENAI_MODEL || 'gpt-5.4-mini',
    fallbackModels: [
      { id: 'gpt-5.4', label: 'GPT-5.4', description: 'Geração 5' },
      { id: 'gpt-5.4-mini', label: 'GPT-5.4 mini', description: 'Geração 5' },
      { id: 'gpt-5.4-nano', label: 'GPT-5.4 nano', description: 'Geração 5' },
      { id: 'gpt-4.1', label: 'GPT-4.1', description: 'Geração 4' },
      { id: 'gpt-4o', label: 'GPT-4o', description: 'Geração 4' },
      { id: 'gpt-4o-mini', label: 'GPT-4o mini', description: 'Geração 4' },
      { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', description: 'Geração 3' },
    ],
  },
  anthropic: {
    id: 'anthropic',
    label: 'Claude',
    apiKey: process.env.ANTHROPIC_API_KEY,
    defaultModelId: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
    fallbackModels: [
      { id: 'claude-opus-4-6', label: 'Claude Opus 4.6', description: 'Geração 4' },
      { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6', description: 'Geração 4' },
      { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5', description: 'Geração 4' },
      { id: 'claude-opus-4-20250514', label: 'Claude Opus 4', description: 'Geração 4' },
      { id: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4', description: 'Geração 4' },
      { id: 'claude-3-7-sonnet-20250219', label: 'Claude Sonnet 3.7', description: 'Geração 3' },
      { id: 'claude-3-5-haiku-20241022', label: 'Claude Haiku 3.5', description: 'Geração 3' },
    ],
  },
};

function formatOpenAIModelLabel(modelId) {
  const normalizedModelId = modelId.replace(/-\d{4}-\d{2}-\d{2}$/u, '');

  return normalizedModelId
    .replace(/^gpt-/u, 'GPT-')
    .replace(/-mini$/u, ' mini')
    .replace(/-nano$/u, ' nano')
    .replace(/-turbo$/u, ' Turbo');
}

function formatAnthropicModelLabel(modelId) {
  const normalizedModelId = modelId.replace(/-\d{8}$/u, '');
  const segments = normalizedModelId.replace(/^claude-/u, '').split('-');
  const families = ['opus', 'sonnet', 'haiku'];

  const familyIndex = segments.findIndex((segment) => families.includes(segment));

  if (familyIndex === -1) {
    return modelId
      .replace(/^claude-/u, 'Claude ')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (character) => character.toUpperCase());
  }

  const family = segments[familyIndex];
  const versionSegments =
    familyIndex === 0 ? segments.slice(1) : segments.slice(0, familyIndex);
  const version = versionSegments.join('.');
  const formattedFamily = family.charAt(0).toUpperCase() + family.slice(1);

  return version
    ? `Claude ${formattedFamily} ${version}`
    : `Claude ${formattedFamily}`;
}

function getOpenAIGenerationLabel(modelId) {
  if (modelId.startsWith('gpt-5')) {
    return 'Geração 5';
  }

  if (modelId.startsWith('gpt-4')) {
    return 'Geração 4';
  }

  if (modelId.startsWith('gpt-3.5')) {
    return 'Geração 3';
  }

  return 'Outras gerações';
}

function getAnthropicGenerationLabel(modelId) {
  const normalizedModelId = modelId.replace(/-\d{8}$/u, '');
  const parts = normalizedModelId.replace(/^claude-/u, '').split('-');

  for (const part of parts) {
    if (/^\d+$/u.test(part)) {
      return `Geração ${part}`;
    }
  }

  return 'Outras gerações';
}

function dedupeModels(models) {
  const seen = new Set();

  return models.filter((model) => {
    if (!model?.id || seen.has(model.id)) {
      return false;
    }

    seen.add(model.id);
    return true;
  });
}

function sortByPreferredOrder(models, preferredIds) {
  return [...models].sort((left, right) => {
    const leftIndex = preferredIds.indexOf(left.id);
    const rightIndex = preferredIds.indexOf(right.id);

    if (leftIndex === -1 && rightIndex === -1) {
      return left.label.localeCompare(right.label);
    }

    if (leftIndex === -1) {
      return 1;
    }

    if (rightIndex === -1) {
      return -1;
    }

    return leftIndex - rightIndex;
  });
}

function isSupportedOpenAIModel(modelId) {
  const excludedSegments = [
    'audio',
    'realtime',
    'transcribe',
    'tts',
    'image',
    'search',
    'moderation',
    'embedding',
    'whisper',
    'dall',
    'omni',
    'chatgpt',
    'instruct',
  ];

  if (excludedSegments.some((segment) => modelId.includes(segment))) {
    return false;
  }

  return (
    modelId.startsWith('gpt-5') ||
    modelId.startsWith('gpt-4.1') ||
    modelId.startsWith('gpt-4o') ||
    modelId.startsWith('gpt-4-turbo') ||
    modelId === 'gpt-4' ||
    modelId.startsWith('gpt-3.5-turbo')
  );
}

function isSupportedAnthropicModel(modelId) {
  return modelId.startsWith('claude-');
}

async function fetchOpenAIModels(provider) {
  const response = await fetch('https://api.openai.com/v1/models', {
    headers: {
      Authorization: `Bearer ${provider.apiKey}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    const message =
      data.error?.message || `OpenAI models request failed with status ${response.status}.`;
    throw new Error(message);
  }

  const preferredIds = provider.fallbackModels.map((model) => model.id);
  const preferredMap = new Map(provider.fallbackModels.map((model) => [model.id, model]));
  const dynamicModels = (data.data || [])
    .map((model) => model.id)
    .filter((modelId) => typeof modelId === 'string' && isSupportedOpenAIModel(modelId))
    .map((modelId) => {
      const preferredModel = preferredMap.get(modelId);

      if (preferredModel) {
        return preferredModel;
      }

      return {
        id: modelId,
        label: formatOpenAIModelLabel(modelId),
        description: getOpenAIGenerationLabel(modelId),
      };
    });

  return sortByPreferredOrder(dedupeModels(dynamicModels), preferredIds);
}

async function fetchAnthropicModels(provider) {
  const response = await fetch('https://api.anthropic.com/v1/models', {
    headers: {
      'x-api-key': provider.apiKey,
      'anthropic-version': '2023-06-01',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    const message =
      data.error?.message || `Anthropic models request failed with status ${response.status}.`;
    throw new Error(message);
  }

  const preferredIds = provider.fallbackModels.map((model) => model.id);
  const preferredMap = new Map(provider.fallbackModels.map((model) => [model.id, model]));
  const dynamicModels = (data.data || [])
    .map((model) => model.id)
    .filter((modelId) => typeof modelId === 'string' && isSupportedAnthropicModel(modelId))
    .map((modelId) => {
      const preferredModel = preferredMap.get(modelId);

      if (preferredModel) {
        return preferredModel;
      }

      return {
        id: modelId,
        label: formatAnthropicModelLabel(modelId),
        description: getAnthropicGenerationLabel(modelId),
      };
    });

  return sortByPreferredOrder(dedupeModels(dynamicModels), preferredIds);
}

async function getProviderModels(provider) {
  const cached = providerModelsCache.get(provider.id);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.models;
  }

  try {
    const models =
      provider.id === 'openai'
        ? await fetchOpenAIModels(provider)
        : await fetchAnthropicModels(provider);

    if (models.length > 0) {
      providerModelsCache.set(provider.id, {
        expiresAt: Date.now() + modelCacheTtlMs,
        models,
      });

      return models;
    }
  } catch (error) {
    console.warn(`Unable to refresh models for ${provider.id}. Using fallback list.`, error);
  }

  const fallbackModels = provider.fallbackModels;
  providerModelsCache.set(provider.id, {
    expiresAt: Date.now() + modelCacheTtlMs,
    models: fallbackModels,
  });

  return fallbackModels;
}

async function getConfiguredProviders() {
  const configuredProviders = Object.values(providerCatalog).filter((provider) => provider.apiKey);

  return Promise.all(
    configuredProviders.map(async (provider) => {
      const models = await getProviderModels(provider);
      const defaultModelId = models.some((model) => model.id === provider.defaultModelId)
        ? provider.defaultModelId
        : models[0]?.id;

      return {
        id: provider.id,
        label: provider.label,
        defaultModelId,
        models,
      };
    })
  );
}

function getDefaultProviderId(configuredProviders) {
  const requestedDefault = process.env.DEFAULT_LLM_PROVIDER;

  if (
    requestedDefault &&
    configuredProviders.some((provider) => provider.id === requestedDefault)
  ) {
    return requestedDefault;
  }

  return configuredProviders[0]?.id;
}

async function getResolvedModel(provider, requestedModelId) {
  const models = await getProviderModels(provider);
  const resolvedModelId = requestedModelId || provider.defaultModelId;
  const model = models.find((candidate) => candidate.id === resolvedModelId);

  if (!model) {
    throw httpError(400, `Modelo "${resolvedModelId}" nao esta disponivel para ${provider.label}.`);
  }

  return model;
}

function assertValidMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw httpError(400, 'At least one message is required.');
  }

  const isValid = messages.every(
    (message) =>
      message &&
      (message.role === 'user' || message.role === 'assistant') &&
      typeof message.content === 'string' &&
      message.content.trim().length > 0
  );

  if (!isValid) {
    throw httpError(400, 'Messages must contain role and content.');
  }
}

function assertValidAgentPayload(payload, availableProviderIds) {
  const { name, description, providerId, systemPrompt } = payload ?? {};

  if (typeof name !== 'string' || name.trim().length < 3) {
    throw httpError(400, 'Informe um nome de agente com pelo menos 3 caracteres.');
  }

  if (typeof description !== 'string' || description.trim().length < 8) {
    throw httpError(400, 'Informe uma descricao com pelo menos 8 caracteres.');
  }

  if (!availableProviderIds.includes(providerId)) {
    throw httpError(400, 'Selecione um provedor valido para o agente.');
  }

  if (typeof systemPrompt !== 'string' || systemPrompt.trim().length < 20) {
    throw httpError(
      400,
      'Informe instrucoes do agente com pelo menos 20 caracteres.'
    );
  }
}

function normalizeInstructions(instructions) {
  if (typeof instructions !== 'string') {
    return undefined;
  }

  const normalizedInstructions = instructions.trim();

  if (!normalizedInstructions) {
    return undefined;
  }

  if (normalizedInstructions.length > 6000) {
    throw httpError(400, 'As instrucoes do agente excedem o limite permitido.');
  }

  return normalizedInstructions;
}

function validateRegistrationInput(name, email, password) {
  if (typeof name !== 'string' || name.trim().length < 3) {
    return 'Informe um nome com pelo menos 3 caracteres.';
  }

  if (typeof email !== 'string' || !emailPattern.test(normalizeEmail(email))) {
    return 'Informe um e-mail valido.';
  }

  if (typeof password !== 'string' || !passwordMeetsRequirements(password)) {
    return 'A senha deve ter no minimo 8 caracteres, incluindo letra minuscula, letra maiuscula, numero e caractere especial.';
  }

  return null;
}

function validateLoginInput(email, password) {
  if (typeof email !== 'string' || !emailPattern.test(normalizeEmail(email))) {
    return 'Informe um e-mail valido.';
  }

  if (typeof password !== 'string' || password.length === 0) {
    return 'Informe a senha.';
  }

  return null;
}

function extractOpenAIText(data) {
  if (typeof data.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim();
  }

  for (const item of data.output || []) {
    if (item.type !== 'message') {
      continue;
    }

    for (const contentItem of item.content || []) {
      if (contentItem.type === 'output_text' && contentItem.text?.trim()) {
        return contentItem.text.trim();
      }
    }
  }

  throw new Error('OpenAI returned no text content.');
}

function extractAnthropicText(data) {
  const text = (data.content || [])
    .filter((item) => item.type === 'text' && item.text?.trim())
    .map((item) => item.text.trim())
    .join('\n\n');

  if (!text) {
    throw new Error('Anthropic returned no text content.');
  }

  return text;
}

async function generateWithOpenAI(provider, modelId, messages, instructions) {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${provider.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelId,
      ...(instructions ? { instructions } : {}),
      input: messages.map((message) => ({
        role: message.role,
        content: [{ type: 'input_text', text: message.content }],
      })),
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const message =
      data.error?.message || `OpenAI request failed with status ${response.status}.`;
    throw new Error(message);
  }

  return extractOpenAIText(data);
}

async function generateWithAnthropic(provider, modelId, messages, instructions) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': provider.apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: Number(process.env.ANTHROPIC_MAX_TOKENS || 1024),
      ...(instructions ? { system: instructions } : {}),
      messages: messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const message =
      data.error?.message || `Anthropic request failed with status ${response.status}.`;
    throw new Error(message);
  }

  return extractAnthropicText(data);
}

app.post(
  '/api/auth/register',
  asyncHandler(async (request, response) => {
    const { name, email, password } = request.body ?? {};
    const validationError = validateRegistrationInput(name, email, password);

    if (validationError) {
      throw httpError(400, validationError);
    }

    const normalizedEmail = normalizeEmail(email);
    const store = await readAuthStore();
    const storeChanged = pruneExpiredSessions(store);

    if (storeChanged) {
      await writeAuthStore(store);
    }

    if (findUserByEmail(store, normalizedEmail)) {
      throw httpError(409, 'Ja existe uma conta cadastrada com este e-mail.');
    }

    const now = new Date().toISOString();
    const user = {
      id: randomUUID(),
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: await hashPassword(password),
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
    };
    const { token, session } = createSession(user.id);

    store.users.push(user);
    store.sessions.push(session);
    await writeAuthStore(store);

    response.status(201).json({
      token,
      user: sanitizeUser(user),
    });
  })
);

app.post(
  '/api/auth/login',
  asyncHandler(async (request, response) => {
    const { email, password } = request.body ?? {};
    const validationError = validateLoginInput(email, password);

    if (validationError) {
      throw httpError(400, validationError);
    }

    const normalizedEmail = normalizeEmail(email);
    const store = await readAuthStore();
    const storeChanged = pruneExpiredSessions(store);

    if (storeChanged) {
      await writeAuthStore(store);
    }

    const user = findUserByEmail(store, normalizedEmail);

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throw httpError(401, 'E-mail ou senha invalidos.');
    }

    user.lastLoginAt = new Date().toISOString();
    user.updatedAt = user.lastLoginAt;

    const { token, session } = createSession(user.id);
    store.sessions.push(session);
    await writeAuthStore(store);

    response.json({
      token,
      user: sanitizeUser(user),
    });
  })
);

app.get('/api/auth/me', authenticateRequest, (request, response) => {
  response.json({
    user: sanitizeUser(request.auth.user),
  });
});

app.post(
  '/api/auth/logout',
  authenticateRequest,
  asyncHandler(async (request, response) => {
    const store = await readAuthStore();
    removeSessionByToken(store, request.auth.token);
    await writeAuthStore(store);
    response.status(204).send();
  })
);

app.get(
  '/api/providers',
  authenticateRequest,
  asyncHandler(async (_request, response) => {
    const providers = await getConfiguredProviders();

    response.json({
      providers,
      defaultProviderId: getDefaultProviderId(providers),
    });
  })
);

app.get(
  '/api/agents',
  authenticateRequest,
  asyncHandler(async (request, response) => {
    const store = await readAgentStore();
    const agents = store.agents
      .filter((agent) => agent.userId === request.auth.user.id)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .map(sanitizeAgent);

    response.json({ agents });
  })
);

app.post(
  '/api/agents',
  authenticateRequest,
  asyncHandler(async (request, response) => {
    const providerIds = Object.keys(providerCatalog);
    assertValidAgentPayload(request.body, providerIds);

    const store = await readAgentStore();
    const agent = createAgent({
      userId: request.auth.user.id,
      name: request.body.name,
      description: request.body.description,
      providerId: request.body.providerId,
      systemPrompt: request.body.systemPrompt,
    });

    store.agents.push(agent);
    await writeAgentStore(store);

    response.status(201).json({ agent: sanitizeAgent(agent) });
  })
);

app.put(
  '/api/agents/:agentId',
  authenticateRequest,
  asyncHandler(async (request, response) => {
    const providerIds = Object.keys(providerCatalog);
    assertValidAgentPayload(request.body, providerIds);

    const store = await readAgentStore();
    const agent = store.agents.find(
      (candidate) =>
        candidate.id === request.params.agentId &&
        candidate.userId === request.auth.user.id
    );

    if (!agent) {
      throw httpError(404, 'Agente nao encontrado.');
    }

    agent.name = request.body.name.trim();
    agent.description = request.body.description.trim();
    agent.providerId = request.body.providerId;
    agent.systemPrompt = request.body.systemPrompt.trim();
    agent.updatedAt = new Date().toISOString();

    await writeAgentStore(store);

    response.json({ agent: sanitizeAgent(agent) });
  })
);

app.delete(
  '/api/agents/:agentId',
  authenticateRequest,
  asyncHandler(async (request, response) => {
    const store = await readAgentStore();
    const nextAgents = store.agents.filter(
      (agent) =>
        !(
          agent.id === request.params.agentId &&
          agent.userId === request.auth.user.id
        )
    );

    if (nextAgents.length === store.agents.length) {
      throw httpError(404, 'Agente nao encontrado.');
    }

    store.agents = nextAgents;
    await writeAgentStore(store);
    response.status(204).send();
  })
);

app.post(
  '/api/messages',
  authenticateRequest,
  asyncHandler(async (request, response) => {
    const { provider: providerId, modelId, messages, instructions } = request.body ?? {};
    const provider = providerCatalog[providerId];

    if (!provider || !provider.apiKey) {
      throw httpError(400, `Provider "${providerId}" is not configured.`);
    }

    assertValidMessages(messages);
    const normalizedInstructions = normalizeInstructions(instructions);
    const resolvedModel = await getResolvedModel(provider, modelId);

    const content =
      providerId === 'openai'
        ? await generateWithOpenAI(
            provider,
            resolvedModel.id,
            messages,
            normalizedInstructions
          )
        : await generateWithAnthropic(
            provider,
            resolvedModel.id,
            messages,
            normalizedInstructions
          );

    response.json({
      message: {
        id: randomUUID(),
        role: 'assistant',
        content,
        timestamp: new Date().toISOString(),
      },
    });
  })
);

app.use('/api', apiNotFoundHandler);

if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));

  app.use((request, response, next) => {
    if (request.path.startsWith('/api/')) {
      return next();
    }

    return response.sendFile(distIndexPath);
  });
}

app.use(errorHandler);

app.listen(port, () => {
  console.log(`LLM API server listening on http://localhost:${port}`);
});
