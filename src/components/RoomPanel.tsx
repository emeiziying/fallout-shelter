import React from 'react';
import { Room, RoomType, Resources } from '../types';
import { formatNumber, canAffordCost } from '../utils/gameLogic';
import './RoomPanel.css';

interface RoomPanelProps {
  rooms: Room[];
  resources: Resources;
  onBuildRoom: (roomType: RoomType) => void;
  onCancelBuild: (roomId: string) => void;
}

const RoomPanel: React.FC<RoomPanelProps> = ({ rooms, resources, onBuildRoom, onCancelBuild }) => {
  const roomTypes: { type: RoomType; name: string; icon: string; description: string }[] = [
    { type: 'farm', name: '农场', icon: '🌾', description: '生产食物维持居民生存' },
    { type: 'water_plant', name: '净水厂', icon: '💧', description: '净化水源保证饮用安全' },
    { type: 'power_station', name: '发电站', icon: '⚡', description: '为避难所提供电力' },
    { type: 'workshop', name: '工坊', icon: '🔧', description: '制造各种材料和工具' },
    { type: 'quarters', name: '宿舍', icon: '🏠', description: '为居民提供休息场所' },
    { type: 'medical', name: '医疗室', icon: '🏥', description: '治疗伤病制造药物' },
    { type: 'laboratory', name: '实验室', icon: '🧪', description: '研发新技术制造组件' },
    { type: 'armory', name: '军械库', icon: '🔫', description: '制造武器防御设备' },
    { type: 'training_room', name: '训练室', icon: '💪', description: '提升居民战斗技能' },
  ];

  const getRoomCost = (roomType: RoomType): Partial<Resources> => {
    const costs = {
      farm: { materials: 50, power: 20 },
      water_plant: { materials: 40, components: 5 },
      power_station: { materials: 60, components: 10 },
      workshop: { materials: 80, power: 30 },
      quarters: { materials: 30 },
      medical: { materials: 70, components: 15 },
      laboratory: { materials: 100, components: 20, chemicals: 10 },
      armory: { materials: 90, components: 25 },
      training_room: { materials: 60, components: 10 },
    };
    return costs[roomType];
  };

  const getRoomsByType = (roomType: RoomType) => {
    return rooms.filter(room => room.type === roomType);
  };

  return (
    <div className="card">
      <h2>设施建造</h2>
      <div className="room-grid">
        {roomTypes.map(({ type, name, icon, description }) => {
          const cost = getRoomCost(type);
          const canAfford = canAffordCost(resources, cost);
          const existingRooms = getRoomsByType(type);
          
          return (
            <div key={type} className="room-card">
              <div className="room-header">
                <span className="room-icon">{icon}</span>
                <div className="room-info">
                  <h3>{name}</h3>
                  <p className="room-description">{description}</p>
                </div>
              </div>
              
              <div className="room-stats">
                <div className="existing-count">
                  已建造: {existingRooms.length}
                </div>
                
                <div className="room-cost">
                  {Object.entries(cost).map(([resource, amount]) => (
                    <span key={resource} className="cost-item">
                      {getResourceIcon(resource)} {formatNumber(amount || 0)}
                    </span>
                  ))}
                </div>
                
                <button
                  onClick={() => onBuildRoom(type)}
                  disabled={!canAfford}
                  className="build-button"
                >
                  建造
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="existing-rooms">
        <h3>已建设施</h3>
        <div className="rooms-list">
          {rooms.map(room => {
            const roomType = roomTypes.find(rt => rt.type === room.type);
            return (
              <div key={room.id} className="room-item">
                <div className="room-main-info">
                  <span className="room-name">
                    {roomType?.icon} {roomType?.name} Lv.{room.level}
                  </span>
                  {!room.isBuilding ? (
                    <span className="room-workers">
                      工人: {room.workers.length}/{room.maxWorkers}
                    </span>
                  ) : (
                    <div className="build-info">
                      <div className="build-progress-container">
                        <div className="build-progress-bar">
                          <div 
                            className="build-progress-fill"
                            style={{ width: `${(room.buildProgress / room.buildTime) * 100}%` }}
                          />
                        </div>
                        <span className="build-progress-text">
                          {Math.round((room.buildProgress / room.buildTime) * 100)}%
                        </span>
                      </div>
                      <div className="build-details">
                        <span className="build-workers">
                          建造工人: {room.buildWorkers.length}/{room.maxBuildWorkers}
                        </span>
                        <span className="build-time">
                          剩余: {Math.max(0, Math.ceil(room.buildTime - room.buildProgress))}秒
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                {room.isBuilding && (
                  <button 
                    className="cancel-build-button"
                    onClick={() => onCancelBuild(room.id)}
                    title="取消建造并返还资源"
                  >
                    取消
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

const getResourceIcon = (resource: string) => {
  const icons = {
    food: '🍞',
    water: '💧',
    power: '⚡',
    materials: '🔧',
    components: '⚙️',
    chemicals: '🧪',
  };
  return icons[resource as keyof typeof icons] || '';
};

export default RoomPanel;