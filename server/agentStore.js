import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, 'data');
const agentStorePath = path.join(dataDir, 'agents-store.json');

function normalizeStore(store) {
  return {
    agents: Array.isArray(store?.agents) ? store.agents : [],
  };
}

async function ensureAgentStore() {
  await fs.mkdir(dataDir, { recursive: true });

  try {
    await fs.access(agentStorePath);
  } catch {
    await fs.writeFile(agentStorePath, JSON.stringify({ agents: [] }, null, 2));
  }
}

export async function readAgentStore() {
  await ensureAgentStore();
  const raw = await fs.readFile(agentStorePath, 'utf8');

  try {
    return normalizeStore(JSON.parse(raw));
  } catch {
    return { agents: [] };
  }
}

export async function writeAgentStore(store) {
  await ensureAgentStore();
  await fs.writeFile(agentStorePath, JSON.stringify(normalizeStore(store), null, 2));
}

export function sanitizeAgent(agent) {
  return {
    id: agent.id,
    userId: agent.userId,
    name: agent.name,
    description: agent.description,
    providerId: agent.providerId,
    systemPrompt: agent.systemPrompt,
    createdAt: agent.createdAt,
    updatedAt: agent.updatedAt,
  };
}

export function createAgent({ userId, name, description, providerId, systemPrompt }) {
  const now = new Date().toISOString();

  return {
    id: randomUUID(),
    userId,
    name: name.trim(),
    description: description.trim(),
    providerId,
    systemPrompt: systemPrompt.trim(),
    createdAt: now,
    updatedAt: now,
  };
}
