/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { MindMapData, MindMapNode } from '../services/geminiService';

interface MindMapDisplayProps {
  data: MindMapData;
  onExpandSection: (sectionTitle: string, sectionTypes: MindMapNode['type'][]) => void;
  expandingSection: string | null;
}

const InteractiveContent: React.FC<{
  content: string;
}> = ({ content }) => {
  return (
    <p className="node-content">
      {content}
    </p>
  );
};

const NodeCard: React.FC<{ node: MindMapNode }> = ({ node }) => (
  <article className="mind-map-node">
    <h4 className="node-title">{node.title}</h4>
    <InteractiveContent content={node.content} />
  </article>
);


const MindMapDisplay: React.FC<MindMapDisplayProps> = ({ data, onExpandSection, expandingSection }) => {
  const sections: { title: string; types: MindMapNode['type'][] }[] = [
    { title: 'Inspirations & Precursors', types: ['inspiration', 'key_figure'] },
    { title: 'Core Concept', types: ['core_concept'] },
    { title: 'Innovation & Impact', types: ['innovation', 'impact', 'related_work'] },
  ];

  return (
    <div className="mind-map-container">
      {data.abstract && (
        <div className="mind-map-abstract">
          <h4>Abstract</h4>
          <InteractiveContent content={data.abstract} />
        </div>
      )}
      {sections.map(section => {
        const nodes = data.nodes.filter(node => section.types.includes(node.type));
        if (nodes.length === 0) return null;
        
        const isCurrentlyExpanding = expandingSection === section.title;

        return (
          <section key={section.title} className="mind-map-section">
            <h3>{section.title}</h3>
            <div className="mind-map-nodes-grid">
              {nodes.map(node => (
                <NodeCard key={node.id} node={node} />
              ))}
            </div>
            <div className="mind-map-controls">
                <button 
                  onClick={() => onExpandSection(section.title, section.types)}
                  className="show-more-btn"
                  disabled={isCurrentlyExpanding}
                >
                  {isCurrentlyExpanding ? 'Loading...' : 'Show More...'}
                </button>
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default MindMapDisplay;