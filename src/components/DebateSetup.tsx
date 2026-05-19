/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { AgentProfile } from './AgentsPopup';

interface DebateSetupProps {
  agents: AgentProfile[];
  onStartDebate: (agent1: AgentProfile, agent2: AgentProfile) => void;
}

const DebateSetup: React.FC<DebateSetupProps> = ({ agents, onStartDebate }) => {
  const [debater1Id, setDebater1Id] = useState<string>(agents[0]?.id || '');
  const [debater2Id, setDebater2Id] = useState<string>(agents[1]?.id || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const agent1 = agents.find(a => a.id === debater1Id);
    const agent2 = agents.find(a => a.id === debater2Id);
    if (agent1 && agent2 && agent1.id !== agent2.id) {
      onStartDebate(agent1, agent2);
    }
  };

  const isButtonDisabled = !debater1Id || !debater2Id || debater1Id === debater2Id;

  return (
    <div className="debate-setup-container">
      <h4>Choose the Debaters</h4>
      <form onSubmit={handleSubmit}>
        <div className="debate-selectors">
          <div className="debate-selector">
            <label htmlFor="debater1">Debater 1</label>
            <select
              id="debater1"
              value={debater1Id}
              onChange={(e) => setDebater1Id(e.target.value)}
            >
              {agents.map(agent => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </div>
          <div className="debate-selector">
            <label htmlFor="debater2">Debater 2</label>
            <select
              id="debater2"
              value={debater2Id}
              onChange={(e) => setDebater2Id(e.target.value)}
            >
              {agents.map(agent => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button type="submit" className="debate-start-button" disabled={isButtonDisabled}>
          {debater1Id === debater2Id ? 'Select different agents' : 'Begin Debate'}
        </button>
      </form>
    </div>
  );
};

export default DebateSetup;
