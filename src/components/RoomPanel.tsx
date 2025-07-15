import React, { useState } from 'react';
import { Room, RoomType, Resources, Resident } from '../types';
import { formatNumber, canAffordCost } from '../utils/gameLogic';
import './RoomPanel.css';

interface RoomPanelProps {
  rooms: Room[];
  resources: Resources;
  unlockedRooms: RoomType[];
  residents: Resident[];
  onBuildRoom: (roomType: RoomType) => void;
  onUpgradeRoom: (roomId: string) => void;
  onCancelBuild: (roomId: string) => void;
  onAssignWorker: (residentId: string, roomId: string) => void;
  onUnassignWorker?: (residentId: string) => void;
}

const RoomPanel: React.FC<RoomPanelProps> = ({ rooms, resources, unlockedRooms, residents, onBuildRoom, onUpgradeRoom, onCancelBuild, onAssignWorker, onUnassignWorker }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['all', '资源生产', '功能设施', '居住设施', '存储设施']));

  const roomTypes: { type: RoomType; name: string; icon: string; description: string; category: string }[] = [
    { type: 'farm', name: '农场', icon: '🌾', description: '生产食物维持居民生存', category: '资源生产' },
    { type: 'water_plant', name: '净水厂', icon: '💧', description: '净化水源保证饮用安全', category: '资源生产' },
    { type: 'power_station', name: '发电站', icon: '⚡', description: '为避难所提供电力', category: '资源生产' },
    { type: 'workshop', name: '工坊', icon: '🔧', description: '制造各种材料和工具', category: '资源生产' },
    { type: 'workbench', name: '工作台', icon: '🔨', description: '基础组件制造，入门级设施', category: '资源生产' },
    { type: 'quarters', name: '宿舍', icon: '🏠', description: '增加人口上限，每级+4人口', category: '居住设施' },
    { type: 'medical', name: '医疗室', icon: '🏥', description: '治疗伤病制造药物', category: '功能设施' },
    { type: 'laboratory', name: '实验室', icon: '🧪', description: '生产研究点，解锁新科技', category: '功能设施' },
    { type: 'armory', name: '军械库', icon: '🔫', description: '制造武器和军用组件', category: '功能设施' },
    { type: 'training_room', name: '训练室', icon: '💪', description: '提升居民战斗技能', category: '功能设施' },
    { type: 'warehouse', name: '仓库', icon: '📦', description: '增加食物、材料、组件存储上限', category: '存储设施' },
    { type: 'water_tank', name: '蓄水池', icon: '🗂️', description: '增加水资源存储上限', category: '存储设施' },
    { type: 'power_bank', name: '储能站', icon: '🔋', description: '增加电力存储上限', category: '存储设施' },
    { type: 'vault', name: '金库', icon: '🏦', description: '增加金钱存储并产生利息', category: '存储设施' },
  ];

  const categories = ['all', '资源生产', '功能设施', '居住设施', '存储设施'];
  const categoryNames = {
    'all': '全部',
    '资源生产': '资源生产',
    '功能设施': '功能设施', 
    '居住设施': '居住设施',
    '存储设施': '存储设施',
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const getRoomsByCategory = () => {
    const filteredRooms = rooms.filter(room => {
      const roomType = roomTypes.find(rt => rt.type === room.type);
      const matchesSearch = searchTerm === '' || 
        roomType?.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || 
        roomType?.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    // 按房间类型分组
    const roomsByType: { [key: string]: Room[] } = {};
    filteredRooms.forEach(room => {
      if (!roomsByType[room.type]) {
        roomsByType[room.type] = [];
      }
      roomsByType[room.type].push(room);
    });

    if (selectedCategory === 'all') {
      // 按类别分组，但保持类型分组
      const grouped: { [key: string]: { [key: string]: Room[] } } = {};
      categories.slice(1).forEach(cat => {
        grouped[cat] = {};
        Object.entries(roomsByType).forEach(([type, rooms]) => {
          const roomType = roomTypes.find(rt => rt.type === type);
          if (roomType?.category === cat) {
            grouped[cat][type] = rooms;
          }
        });
      });
      return grouped;
    } else {
      // 单一类别，但保持类型分组
      const singleCategory: { [key: string]: Room[] } = {};
      Object.entries(roomsByType).forEach(([type, rooms]) => {
        const roomType = roomTypes.find(rt => rt.type === type);
        if (roomType?.category === selectedCategory) {
          singleCategory[type] = rooms;
        }
      });
      return { [selectedCategory]: singleCategory };
    }
  };

  const getRoomCost = (roomType: RoomType): Partial<Resources> => {
    const costs = {
      farm: { materials: 50, power: 20 },
      water_plant: { materials: 40, components: 5 },
      power_station: { materials: 60, components: 10 },
      workshop: { materials: 80, power: 30 },
      workbench: { materials: 40 },
      quarters: { materials: 30 },
      medical: { materials: 70, components: 15 },
      laboratory: { materials: 100, components: 15, chemicals: 10 },
      armory: { materials: 90, components: 15 },
      training_room: { materials: 60, components: 10 },
      warehouse: { materials: 100, money: 200 },
      water_tank: { materials: 80, components: 15 },
      power_bank: { materials: 120, components: 25 },
      vault: { materials: 150, components: 30, money: 300 },
    };
    return costs[roomType];
  };

  const getRoomsByType = (roomType: RoomType) => {
    return rooms.filter(room => room.type === roomType);
  };

  const getBuiltRoomsByType = (roomType: RoomType) => {
    return rooms.filter(room => room.type === roomType && !room.isBuilding);
  };

  const renderRoomTypeGroup = (roomType: string, roomList: Room[]) => {
    const roomTypeData = roomTypes.find(rt => rt.type === roomType);
    if (!roomTypeData || roomList.length === 0) return null;

    return (
      <div key={roomType} className="room-type-group">
        <div className="room-type-header">
          <h4>
            {roomTypeData.icon} {roomTypeData.name} ({roomList.length})
          </h4>
        </div>
        <div className="room-type-list">
          {roomList.map(room => (
            <div key={room.id} className="room-card">
              <div className="room-card-header">
                <span className="room-name">
                  Lv.{room.level} #{room.id.split('_').pop()?.slice(-4)}
                </span>
              </div>
              
              <div className="room-card-content">
                {!room.isBuilding ? (
                  room.type === 'quarters' ? (
                    <div className="room-capacity">
                      人口容量: +{4 * room.level}
                    </div>
                  ) : (
                    <div className="room-workers-section">
                      <div className="room-workers">
                        工人: {room.workers.length}/{room.maxWorkers}
                      </div>
                      {room.workers.length > 0 && onUnassignWorker && (
                        <div className="workers-list">
                          {room.workers.map((workerId) => {
                            const worker = residents.find(r => r.id === workerId);
                            return (
                              <button
                                key={workerId}
                                className="remove-worker-button"
                                onClick={() => onUnassignWorker(workerId)}
                                title="移除此工人"
                              >
                                移除 {worker?.name || '工人'}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {room.workers.length < room.maxWorkers && (
                        <div className="assign-worker-section">
                          <select
                            className="worker-select"
                            onChange={(e) => {
                              if (e.target.value) {
                                onAssignWorker(e.target.value, room.id);
                                e.target.value = '';
                              }
                            }}
                            defaultValue=""
                          >
                            <option value="">选择空闲居民...</option>
                            {residents
                              .filter(resident => !resident.isWorking)
                              .map(resident => (
                                <option key={resident.id} value={resident.id}>
                                  {resident.name}
                                </option>
                              ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )
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
                      <span className={`build-time ${room.buildWorkers.length === 0 ? 'no-workers' : ''}`}>
                        {room.buildWorkers.length > 0 
                          ? `剩余: ${Math.max(0, Math.ceil(room.buildTime - room.buildProgress))}秒`
                          : "需要工人建造"
                        }
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="room-actions">
                {room.isBuilding ? (
                  <button 
                    className="cancel-build-button"
                    onClick={() => onCancelBuild(room.id)}
                    title="取消建造并返还资源"
                  >
                    取消
                  </button>
                ) : (
                  <div className="upgrade-section">
                    <div className="upgrade-info">
                      <div className="upgrade-cost">
                        <span className="upgrade-label">升级至Lv.{room.level + 1}:</span>
                        {Object.entries(room.upgradeCost).map(([resource, amount]) => (
                          <span key={resource} className="cost-item">
                            {getResourceIcon(resource)} {formatNumber(amount || 0)}
                          </span>
                        ))}
                      </div>
                      <div className="upgrade-benefits">
                        <span className="benefits-text">
                          生产率: +{((room.level + 1) * 20)}% | 工人位: +{Math.floor((room.level + 1) / 2)}
                        </span>
                      </div>
                    </div>
                    <button
                      className="upgrade-button"
                      onClick={() => onUpgradeRoom(room.id)}
                      disabled={!canAffordCost(resources, room.upgradeCost)}
                      title="升级设施"
                    >
                      升级
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="card">
      <h2>设施建造</h2>
      <div className="room-grid">
        {roomTypes.filter(({ type }) => unlockedRooms.includes(type)).map(({ type, name, icon, description }) => {
          const cost = getRoomCost(type);
          const canAfford = canAffordCost(resources, cost);
          const existingRooms = getRoomsByType(type);
          const builtRooms = getBuiltRoomsByType(type);
          
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
                  已建造: {builtRooms.length}
                  {existingRooms.length > builtRooms.length && (
                    <span className="building-count"> (建造中: {existingRooms.length - builtRooms.length})</span>
                  )}
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
        <div className="rooms-header">
          <h3>已建设施 ({rooms.length})</h3>
          <div className="rooms-controls">
            <input
              type="text"
              placeholder="搜索设施..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <div className="category-filters">
              {categories.map(category => (
                <button
                  key={category}
                  className={`category-filter ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {categoryNames[category as keyof typeof categoryNames]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {Object.entries(getRoomsByCategory()).map(([category, categoryData]) => {
          const totalRooms = selectedCategory === 'all' ? 
            Object.values(categoryData as { [key: string]: Room[] }).flat().length :
            Object.values(categoryData as { [key: string]: Room[] }).flat().length;
          
          if (totalRooms === 0) return null;
          
          const isExpanded = expandedCategories.has(category);
          
          return (
            <div key={category} className="category-section">
              <div 
                className="category-header"
                onClick={() => toggleCategory(category)}
              >
                <h4>
                  <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>▶</span>
                  {categoryNames[category as keyof typeof categoryNames]} ({totalRooms})
                </h4>
              </div>
              
              {isExpanded && (
                <div className="rooms-grid">
                  {selectedCategory === 'all' ? 
                    Object.entries(categoryData as { [key: string]: Room[] }).map(([roomType, roomList]) => 
                      renderRoomTypeGroup(roomType, roomList)
                    ) :
                    Object.entries(categoryData as { [key: string]: Room[] }).map(([roomType, roomList]) => 
                      renderRoomTypeGroup(roomType, roomList)
                    )
                  }
                </div>
              )}
            </div>
          );
        })}
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
    money: '💰',
  };
  return icons[resource as keyof typeof icons] || '';
};

export default RoomPanel;