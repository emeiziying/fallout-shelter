import React, { useState } from 'react';
import { useGameState } from './hooks/useGameState';
import ResourcePanel from './components/ResourcePanel';
import RoomPanel from './components/RoomPanel';
import ResidentPanel from './components/ResidentPanel';
import TechnologyPanel from './components/TechnologyPanel';
import GameStats from './components/GameStats';
import './App.css';

function App() {
  const [notification, setNotification] = useState<string | null>(null);
  
  const { 
    gameState, 
    buildRoom, 
    upgradeRoom,
    cancelBuild, 
    assignWorker, 
    unassignWorker,
    recruitResident, 
    getRecruitmentCost, 
    canRecruitResident,
    startResearch,
    canStartResearch
  } = useGameState();
  const [activeTab, setActiveTab] = useState<'overview' | 'rooms' | 'residents' | 'technology'>('overview');

  const handleBuildRoom = (roomType: any) => {
    const availableForBuilding = gameState.residents.filter(r => !r.assignedRoom);
    
    if (availableForBuilding.length === 0) {
      setNotification('没有空闲居民可以参与建造，建造效率会很低');
      setTimeout(() => setNotification(null), 3000);
    }
    
    buildRoom(roomType);
  };


  return (
    <div className="App">
      {notification && (
        <div className="notification">
          {notification}
        </div>
      )}
      <header className="app-header">
        <h1>🏠 末日避难所</h1>
        <div className="nav-tabs">
          <button 
            className={activeTab === 'overview' ? 'tab-active' : 'tab'}
            onClick={() => setActiveTab('overview')}
          >
            总览
          </button>
          <button 
            className={activeTab === 'rooms' ? 'tab-active' : 'tab'}
            onClick={() => setActiveTab('rooms')}
          >
            设施建造
          </button>
          <button 
            className={activeTab === 'residents' ? 'tab-active' : 'tab'}
            onClick={() => setActiveTab('residents')}
          >
            居民管理
          </button>
          <button 
            className={activeTab === 'technology' ? 'tab-active' : 'tab'}
            onClick={() => setActiveTab('technology')}
          >
            科技研发
          </button>
        </div>
      </header>

      <main className="container">
        <ResourcePanel 
          resources={gameState.resources} 
          resourcesPerSecond={gameState.resourcesPerSecond}
          resourceLimits={gameState.resourceLimits}
        />

        {activeTab === 'overview' && (
          <GameStats gameState={gameState} />
        )}

        {activeTab === 'rooms' && (
          <RoomPanel
            rooms={gameState.rooms}
            resources={gameState.resources}
            unlockedRooms={gameState.unlockedRooms}
            residents={gameState.residents}
            onBuildRoom={handleBuildRoom}
            onUpgradeRoom={upgradeRoom}
            onCancelBuild={cancelBuild}
            onAssignWorker={assignWorker}
            onUnassignWorker={unassignWorker}
          />
        )}

        {activeTab === 'residents' && (
          <ResidentPanel
            residents={gameState.residents}
            rooms={gameState.rooms}
            onAssignWorker={assignWorker}
            onUnassignWorker={unassignWorker}
            onRecruitResident={recruitResident}
            recruitmentCost={getRecruitmentCost()}
            canRecruit={canRecruitResident()}
          />
        )}

        {activeTab === 'technology' && (
          <TechnologyPanel
            technologies={gameState.technologies}
            resources={gameState.resources}
            activeResearch={gameState.activeResearch}
            onStartResearch={startResearch}
            canStartResearch={canStartResearch}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>末日避难所演示版 - 基于React构建的放置类游戏</p>
      </footer>
    </div>
  );
}

export default App;