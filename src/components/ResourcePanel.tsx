import React from 'react';
import { Resources, ResourceLimits } from '../types';
import { formatNumber, formatProductionRate } from '../utils/gameLogic';
import './ResourcePanel.css';

interface ResourcePanelProps {
  resources: Resources;
  resourcesPerSecond: Resources;
  resourceLimits: ResourceLimits;
}

const ResourcePanel: React.FC<ResourcePanelProps> = ({ resources, resourcesPerSecond, resourceLimits }) => {
  const resourceIcons = {
    food: '🍞',
    water: '💧',
    power: '⚡',
    materials: '🔧',
    components: '⚙️',
    chemicals: '🧪',
    money: '💰',
    research: '🔬',
  };

  const resourceNames = {
    food: '食物',
    water: '水',
    power: '电力',
    materials: '材料',
    components: '组件',
    chemicals: '化学品',
    money: '金钱',
    research: '研究',
  };

  return (
    <div className="card compact-resources">
      <h2>资源状况</h2>
      <div className="resource-grid">
        {Object.entries(resources).map(([resourceType, amount]) => {
          const rate = resourcesPerSecond[resourceType as keyof Resources];
          const limit = resourceLimits[resourceType as keyof ResourceLimits];
          const isNearLimit = amount / limit > 0.9;
          const rateColor = rate > 0 ? 'positive' : rate < 0 ? 'negative' : 'neutral';
          
          return (
            <div key={resourceType} className={`resource-compact ${isNearLimit ? 'near-limit' : ''}`}>
              <div className="resource-line">
                <span className="resource-icon">
                  {resourceIcons[resourceType as keyof Resources]}
                </span>
                <span className="resource-name">
                  {resourceNames[resourceType as keyof Resources]}
                </span>
                <span className="resource-amount">
                  {formatNumber(amount)}/{formatNumber(limit)}
                </span>
                {rate !== 0 && amount < limit && (
                  <span className={`resource-rate ${rateColor}`}>
                    {rate > 0 ? '+' : ''}{formatProductionRate(rate)}/s
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ResourcePanel;