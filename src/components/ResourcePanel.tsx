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
    research: '研究点',
  };

  return (
    <div className="card">
      <h2>资源状况</h2>
      <div className="grid grid-3">
        {Object.entries(resources).map(([resourceType, amount]) => {
          const rate = resourcesPerSecond[resourceType as keyof Resources];
          const limit = resourceLimits[resourceType as keyof ResourceLimits];
          const isNearLimit = amount / limit > 0.9;
          
          return (
            <div key={resourceType} className="resource-item">
              <div className="resource-header">
                <span className="resource-icon">
                  {resourceIcons[resourceType as keyof Resources]}
                </span>
                <span className="resource-name">
                  {resourceNames[resourceType as keyof Resources]}
                </span>
              </div>
              <div className="resource-details">
                <div className="resource-amount">
                  <span className={isNearLimit ? 'near-limit' : ''}>
                    {formatNumber(amount)}
                  </span>
                  <span className="resource-limit">
                    / {formatNumber(limit)}
                  </span>
                </div>
                <div className="resource-rate">
                  {rate > 0 ? `+${formatProductionRate(rate)}/秒` : rate < 0 ? `${formatProductionRate(rate)}/秒` : ''}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ResourcePanel;