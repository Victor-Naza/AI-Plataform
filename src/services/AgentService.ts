import type { Agent, AgentPayload } from '../models/Agent';
import { apiService } from './api';

class AgentService {
  async getAgents(): Promise<Agent[]> {
    const response = await apiService.getAgents();
    return response.agents;
  }

  async createAgent(payload: AgentPayload): Promise<Agent> {
    const response = await apiService.createAgent(payload);
    return response.agent;
  }

  async updateAgent(agentId: string, payload: AgentPayload): Promise<Agent> {
    const response = await apiService.updateAgent(agentId, payload);
    return response.agent;
  }

  async deleteAgent(agentId: string): Promise<void> {
    await apiService.deleteAgent(agentId);
  }
}

export const agentService = new AgentService();
