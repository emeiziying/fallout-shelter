import React from 'react';
import { Resources } from '../types';
import { formatNumber } from '../utils/gameLogic';
import './ResourcePanel.css';

interface ResourcePanelProps {
  resources: Resources;
  resourcesPerSecond: Resources;
}

const ResourcePanel: React.FC<ResourcePanelProps> = ({ resources, resourcesPerSecond }) => {
  const resourceIcons = {
    food: '🍞',
    water: '💧',
    power: '⚡',
    materials: '🔧',
    components: '⚙️',
    chemicals: '🧪',
  };

  const resourceNames = {
    food: '食物',
    water: '水',
    power: '电力',
    materials: '材料',
    components: '组件',
    chemicals: '化学品',
  };

  return (
    <div className="card">
      <h2>资源状况</h2>
      <div className="grid grid-3">
        {Object.entries(resources).map(([resourceType, amount]) => {
          const rate = resourcesPerSecond[resourceType as keyof Resources];
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
              <div className="resource-amount">
                {formatNumber(amount)}
              </div>
              <div className="resource-rate">
                {rate > 0 ? `+${formatNumber(rate)}/秒` : rate < 0 ? `${formatNumber(rate)}/秒` : ''}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ResourcePanel;