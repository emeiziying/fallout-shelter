import React from 'react';
import { GameState } from '../types';
import { formatTime } from '../utils/gameLogic';
import './GameStats.css';

interface GameStatsProps {
  gameState: GameState;
}

const GameStats: React.FC<GameStatsProps> = ({ gameState }) => {
  return (
    <div className="card">
      <h2>避难所概况</h2>
      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-icon">🏠</div>
          <div className="stat-content">
            <div className="stat-label">避难所等级</div>
            <div className="stat-value">{gameState.shelterLevel}</div>
          </div>
        </div>
        
        <div className="stat-item">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-label">居民数量</div>
            <div className="stat-value">{gameState.population}/{gameState.maxPopulation}</div>
          </div>
        </div>
        
        <div className="stat-item">
          <div className="stat-icon">🏭</div>
          <div className="stat-content">
            <div className="stat-label">设施数量</div>
            <div className="stat-value">{gameState.rooms.length}</div>
          </div>
        </div>
        
        <div className="stat-item">
          <div className="stat-icon">⏰</div>
          <div className="stat-content">
            <div className="stat-label">运行时间</div>
            <div className="stat-value">{formatTime(gameState.gameTime)}</div>
          </div>
        </div>
        
        <div className="stat-item">
          <div className="stat-icon">💼</div>
          <div className="stat-content">
            <div className="stat-label">工作人员</div>
            <div className="stat-value">
              {gameState.residents.filter(r => r.isWorking).length}/{gameState.residents.length}
            </div>
          </div>
        </div>
        
        <div className="stat-item">
          <div className="stat-icon">😊</div>
          <div className="stat-content">
            <div className="stat-label">平均心情</div>
            <div className="stat-value">
              {gameState.residents.length > 0 ? 
                Math.round(gameState.residents.reduce((sum, r) => sum + r.happiness, 0) / gameState.residents.length) : 0}%
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default GameStats;