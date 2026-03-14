import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const app = express();
const port = Number(process.env.PORT || 3001);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');
const distIndexPath = path.join(distDir, 'index.html');

app.use(express.json({ limit: '1mb' }));

const providerCatalog = {
  openai: {
    id: 'openai',
    label: 'GPT',
    model: process.env.OPENAI_MODEL || 'gpt-5-mini',
    apiKey: process.env.OPENAI_API_KEY,
  },
  anthropic: {
    id: 'anthropic',
    label: 'Claude',
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
    apiKey: process.env.ANTHROPIC_API_KEY,
  },
};

function getConfiguredProviders() {
  return Object.values(providerCatalog)
    .filter((provider) => provider.apiKey)
    .map(({ id, label, model }) => ({ id, label, model }));
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

function assertValidMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('At least one message is required.');
  }

  const isValid = messages.every(
    (message) =>
      message &&
      (message.role === 'user' || message.role === 'assistant') &&
      typeof message.content === 'string' &&
      message.content.trim().length > 0
  );

  if (!isValid) {
    throw new Error('Messages must contain role and content.');
  }
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

async function generateWithOpenAI(provider, messages) {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${provider.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: provider.model,
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

async function generateWithAnthropic(provider, messages) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': provider.apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: provider.model,
      max_tokens: Number(process.env.ANTHROPIC_MAX_TOKENS || 1024),
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

app.get('/api/providers', (_request, response) => {
  const providers = getConfiguredProviders();

  response.json({
    providers,
    defaultProviderId: getDefaultProviderId(providers),
  });
});

app.post('/api/messages', async (request, response) => {
  try {
    const { provider: providerId, messages } = request.body ?? {};
    const provider = providerCatalog[providerId];

    if (!provider || !provider.apiKey) {
      return response.status(400).json({
        error: `Provider "${providerId}" is not configured.`,
      });
    }

    assertValidMessages(messages);

    const content =
      providerId === 'openai'
        ? await generateWithOpenAI(provider, messages)
        : await generateWithAnthropic(provider, messages);

    return response.json({
      message: {
        id: randomUUID(),
        role: 'assistant',
        content,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to generate a response.';

    return response.status(500).json({ error: message });
  }
});

if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));

  app.use((request, response, next) => {
    if (request.path.startsWith('/api/')) {
      return next();
    }

    return response.sendFile(distIndexPath);
  });
}

app.listen(port, () => {
  console.log(`LLM API server listening on http://localhost:${port}`);
});
