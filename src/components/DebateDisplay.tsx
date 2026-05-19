/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { DebateTurn } from '../services/geminiService';
import { AgentProfile } from './AgentsPopup';

interface DebateDisplayProps {
  turns: DebateTurn[];
  debatingAgents: [AgentProfile, AgentProfile] | null;
  onFollowUp: (turnIndex: number, agent: AgentProfile) => void;
}

const DebateDisplay: React.FC<DebateDisplayProps> = ({ turns, debatingAgents, onFollowUp }) => {
  return (
    <div className="debate-display-container">
      <h3>The Debate</h3>
      {turns.map((turn, index) => {
        const agent = debatingAgents?.find(a => a.name === turn.agentName);
        return (
          <article key={index} className="debate-turn">
            <h4 className="debate-speaker">{turn.agentName}</h4>
            <div className="debate-statement">
              <p>
                  {turn.statement}
                  {index === turns.length - 1 && <span className="blinking-cursor">|</span>}
              </p>
            </div>
            <div className="debate-turn-footer">
              {agent && (
                <button 
                  onClick={() => onFollowUp(index, agent)}
                  className="follow-up-btn"
                >
                  Follow up
                </button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
};

export default DebateDisplay;