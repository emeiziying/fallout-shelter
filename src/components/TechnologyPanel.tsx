import React from 'react';
import { Technology, Resources } from '../types';
import { formatNumber, canAffordCost } from '../utils/gameLogic';
import './TechnologyPanel.css';

interface TechnologyPanelProps {
  technologies: Technology[];
  resources: Resources;
  activeResearch?: string;
  onStartResearch: (techId: string) => void;
  canStartResearch: (techId: string) => boolean;
}

const TechnologyPanel: React.FC<TechnologyPanelProps> = ({ 
  technologies, 
  resources, 
  activeResearch,
  onStartResearch, 
  canStartResearch 
}) => {
  const getStatusColor = (tech: Technology) => {
    if (tech.isResearched) return '#4CAF50';
    if (tech.isResearching) return '#FF9800';
    if (canStartResearch(tech.id)) return '#2196F3';
    return '#666';
  };

  const getStatusText = (tech: Technology) => {
    if (tech.isResearched) return '已完成';
    if (tech.isResearching) return '研发中';
    if (canStartResearch(tech.id)) return '可研发';
    
    // 检查前置条件
    const prereqsMet = tech.requirements.every(reqId => 
      technologies.find(t => t.id === reqId)?.isResearched
    );
    
    if (!prereqsMet) return '需要前置科技';
    
    // 检查资源
    const canAfford = canAffordCost(resources, tech.cost);
    if (!canAfford) return '资源不足';
    
    if (activeResearch) return '有其他研发进行中';
    
    return '未知';
  };

  const getResourceIcon = (resource: string) => {
    const icons = {
      research: '🔬',
      materials: '🔧',
      components: '⚙️',
      chemicals: '🧪',
      money: '💰',
    };
    return icons[resource as keyof typeof icons] || '';
  };

  return (
    <div className="card">
      <h2>科技研发</h2>
      
      {activeResearch && (
        <div className="active-research">
          <h3>当前研发项目</h3>
          {(() => {
            const tech = technologies.find(t => t.id === activeResearch);
            if (!tech) return null;
            
            const progress = (tech.progress / tech.researchTime) * 100;
            
            return (
              <div className="research-item active">
                <div className="research-header">
                  <span className="research-name">{tech.name}</span>
                  <span className="research-progress">{Math.round(progress)}%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="research-time">
                  剩余时间: {Math.ceil(tech.researchTime - tech.progress)}秒
                </div>
              </div>
            );
          })()}
        </div>
      )}

      <div className="tech-grid">
        {technologies.map(tech => {
          const canStart = canStartResearch(tech.id);
          const statusColor = getStatusColor(tech);
          const statusText = getStatusText(tech);
          
          return (
            <div key={tech.id} className="tech-card">
              <div className="tech-header">
                <h3>{tech.name}</h3>
                <span 
                  className="tech-status"
                  style={{ color: statusColor }}
                >
                  {statusText}
                </span>
              </div>
              
              <p className="tech-description">{tech.description}</p>
              
              {tech.requirements.length > 0 && (
                <div className="tech-requirements">
                  <strong>前置科技:</strong>
                  {tech.requirements.map(reqId => {
                    const reqTech = technologies.find(t => t.id === reqId);
                    const isCompleted = reqTech?.isResearched;
                    return (
                      <span 
                        key={reqId} 
                        className={`requirement ${isCompleted ? 'completed' : 'incomplete'}`}
                      >
                        {reqTech?.name || reqId}
                      </span>
                    );
                  })}
                </div>
              )}
              
              <div className="tech-unlocks">
                <strong>解锁内容:</strong>
                <div className="unlocks-list">
                  {tech.unlocks.map(unlock => (
                    <span key={unlock} className="unlock-item">
                      {unlock}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="tech-cost">
                <strong>研发成本:</strong>
                {Object.entries(tech.cost).map(([resource, amount]) => (
                  <span key={resource} className="cost-item">
                    {getResourceIcon(resource)} {formatNumber(amount || 0)}
                  </span>
                ))}
              </div>
              
              {!tech.isResearched && !tech.isResearching && (
                <button
                  onClick={() => onStartResearch(tech.id)}
                  disabled={!canStart}
                  className="research-button"
                >
                  开始研发
                </button>
              )}
              
              {tech.isResearched && (
                <div className="tech-completed">
                  ✅ 研发完成
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TechnologyPanel;