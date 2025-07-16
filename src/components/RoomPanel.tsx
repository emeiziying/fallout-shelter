import React, { useState } from 'react';
import { Room, RoomType, Resources, Resident } from '../types';
import { formatNumber, canAffordCost } from '../utils/gameLogic';
import './RoomPanel.css';

interface RoomPanelProps {
  rooms: Room[];
  resources: Resources;
  unlockedRooms: RoomType[];
  unlockedUpgrades: Record<RoomType, number>;
  residents: Resident[];
  onBuildRoom: (roomType: RoomType) => void;
  onUpgradeRoom: (roomId: string) => void;
  onCancelBuild: (roomId: string) => void;
  onAssignWorker: (residentId: string, roomId: string) => void;
  onUnassignWorker?: (residentId: string) => void;
}

const RoomPanel: React.FC<RoomPanelProps> = ({ rooms, resources, unlockedRooms, unlockedUpgrades, residents, onBuildRoom, onUpgradeRoom, onCancelBuild, onAssignWorker, onUnassignWorker }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['all', '资源生产', '功能设施', '居住设施', '存储设施']));
  const [showWorkerList, setShowWorkerList] = useState<string | null>(null);

  const getRelevantSkill = (roomType: Room['type'], resident: Resident): number => {
    const skillMapping = {
      farm: resident.skills.management,
      water_plant: resident.skills.engineering,
      power_station: resident.skills.engineering,
      workshop: resident.skills.engineering,
      workbench: resident.skills.engineering,
      quarters: resident.skills.management,
      medical: resident.skills.medical,
      basic_laboratory: resident.skills.research,
      laboratory: resident.skills.research,
      armory: resident.skills.combat,
      training_room: resident.skills.combat,
      warehouse: resident.skills.management,
      water_tank: resident.skills.engineering,
      power_bank: resident.skills.engineering,
      vault: resident.skills.management,
    };
    return skillMapping[roomType] || 1;
  };

  const getJobMatchScore = (room: Room, resident: Resident): number => {
    const skill = getRelevantSkill(room.type, resident);
    const happinessBonus = resident.happiness >= 70 ? 0.2 : 0;
    const healthBonus = resident.health >= 80 ? 0.1 : 0;
    return skill + happinessBonus + healthBonus;
  };

  const roomTypes: { type: RoomType; name: string; icon: string; description: string; category: string }[] = [
    { type: 'farm', name: '农场', icon: '🌾', description: '生产食物维持居民生存', category: '资源生产' },
    { type: 'water_plant', name: '净水厂', icon: '💧', description: '净化水源保证饮用安全', category: '资源生产' },
    { type: 'power_station', name: '发电站', icon: '⚡', description: '为避难所提供电力', category: '资源生产' },
    { type: 'workshop', name: '工坊', icon: '🔧', description: '制造各种材料和工具', category: '资源生产' },
    { type: 'workbench', name: '工作台', icon: '🔨', description: '基础组件制造，入门级设施', category: '资源生产' },
    { type: 'quarters', name: '宿舍', icon: '🏠', description: '增加人口上限，每级+4人口', category: '居住设施' },
    { type: 'medical', name: '医疗室', icon: '🏥', description: '治疗伤病制造药物', category: '功能设施' },
    { type: 'basic_laboratory', name: '研究台', icon: '🔬', description: '基础研究设施，生产少量研究点', category: '功能设施' },
    { type: 'laboratory', name: '高级实验室', icon: '🧪', description: '高效研究设施，生产大量研究点', category: '功能设施' },
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
      basic_laboratory: { materials: 50, components: 5 },
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
          {roomList.map(room => {
            // 检查是否需要工人但没有工人
            const needsWorkers = room.type !== 'quarters' && room.maxWorkers > 0;
            const hasNoWorkers = needsWorkers && room.workers.length === 0;
            const isUnderStaffed = needsWorkers && room.workers.length < room.maxWorkers;
            
            return (
              <div key={room.id} className={`room-card ${hasNoWorkers ? 'no-workers' : ''} ${isUnderStaffed ? 'under-staffed' : ''}`}>
                <div className="room-card-header">
                  <span className="room-name">
                    {hasNoWorkers && '⚠️ '}
                    Lv.{room.level} #{room.id.split('_').pop()?.slice(-4)}
                    {hasNoWorkers && ' - 无工人'}
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
                      <div className={`room-workers ${hasNoWorkers ? 'no-workers-warning' : ''}`}>
                        工人: {room.workers.length}/{room.maxWorkers}
                        {hasNoWorkers && ' ⚠️'}
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
                        <div className={`assign-worker-section ${hasNoWorkers ? 'urgent' : ''}`}>
                          {hasNoWorkers && (
                            <div className="no-worker-alert">
                              ⚠️ 此设施无人工作，生产已停止
                            </div>
                          )}
                          <button
                            className="add-worker-button"
                            onClick={() => setShowWorkerList(showWorkerList === room.id ? null : room.id)}
                          >
                            {showWorkerList === room.id ? '隐藏居民列表' : `添加居民 (${room.maxWorkers - room.workers.length}个空位)`}
                          </button>
                          
                          {showWorkerList === room.id && (
                            <div className="worker-selection-list">
                              {residents
                                .sort((a, b) => {
                                  const matchScoreA = getJobMatchScore(room, a);
                                  const matchScoreB = getJobMatchScore(room, b);
                                  const isIdleA = !a.isWorking;
                                  const isIdleB = !b.isWorking;
                                  
                                  // 优先级：空闲 > 匹配度
                                  if (isIdleA && !isIdleB) return -1; // A空闲，B在工作，A优先
                                  if (!isIdleA && isIdleB) return 1;  // A在工作，B空闲，B优先
                                  
                                  // 同等状态下，按匹配度排序
                                  return matchScoreB - matchScoreA;
                                })
                                .map(resident => {
                                  const skill = getRelevantSkill(room.type, resident);
                                  const matchScore = getJobMatchScore(room, resident);
                                  const isRecommended = skill >= 7;
                                  const isCurrentWorker = room.workers.includes(resident.id);
                                  const isWorking = resident.isWorking;
                                  const currentRoom = isWorking ? rooms.find(r => r.workers.includes(resident.id)) : null;
                                  
                                  if (isCurrentWorker) return null; // 已在当前设施工作的不显示
                                  
                                  return (
                                    <div key={resident.id} className={`worker-option ${isRecommended ? 'recommended' : ''} ${isWorking ? 'working' : 'idle'}`}>
                                      <div className="worker-info">
                                        <span className="worker-name">
                                          {!isWorking && '🔄 '}
                                          {isRecommended ? '★ ' : ''}
                                          {resident.name}
                                          {!isWorking && ' (空闲)'}
                                        </span>
                                        <span className="worker-details">
                                          技能:{skill} | 匹配:{matchScore.toFixed(1)}
                                        </span>
                                        {isWorking && currentRoom && (
                                          <span className="current-job">
                                            当前: {getRoomTypeName(currentRoom.type)}
                                          </span>
                                        )}
                                      </div>
                                      <button
                                        className="assign-button"
                                        onClick={() => {
                                          onAssignWorker(resident.id, room.id);
                                          setShowWorkerList(null);
                                        }}
                                      >
                                        {isWorking ? '调动' : '分配'}
                                      </button>
                                    </div>
                                  );
                                })}
                            </div>
                          )}
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
                        {Object.entries(room.upgradeCost).map(([resource, amount]) => {
                          const currentAmount = resources[resource as keyof Resources] || 0;
                          const hasEnough = currentAmount >= (amount || 0);
                          return (
                            <span key={resource} className={`cost-item ${hasEnough ? 'sufficient' : 'insufficient'}`}>
                              {getResourceIcon(resource)} {formatNumber(amount || 0)}
                              <span className="current-amount">({formatNumber(currentAmount)})</span>
                            </span>
                          );
                        })}
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
                      disabled={!canAffordCost(resources, room.upgradeCost) || room.level >= (unlockedUpgrades[room.type] || 1)}
                      title={room.level >= (unlockedUpgrades[room.type] || 1) ? "需要研究更高级技术才能继续升级" : "升级设施"}
                    >
                      {room.level >= (unlockedUpgrades[room.type] || 1) ? "需要解锁" : "升级"}
                    </button>
                  </div>
                )}
              </div>
            </div>
            );
          })}
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
            <div key={type} className={`room-card build-card ${builtRooms.length > 0 ? 'has-built' : 'not-built'} ${existingRooms.length > builtRooms.length ? 'has-building' : ''}`}>
              <div className="room-header">
                <span className="room-icon">{icon}</span>
                <div className="room-info">
                  <h3>
                    {builtRooms.length > 0 && '✓ '}
                    {name}
                    {builtRooms.length === 0 && ' (未建造)'}
                  </h3>
                  <p className="room-description">{description}</p>
                </div>
              </div>
              
              <div className="room-stats">
                <div className={`existing-count ${builtRooms.length === 0 ? 'no-facilities' : ''}`}>
                  {builtRooms.length === 0 ? (
                    <span className="no-built-indicator">📝 尚未建造此设施</span>
                  ) : (
                    <span className="built-indicator">✓ 已建造: {builtRooms.length}</span>
                  )}
                  {existingRooms.length > builtRooms.length && (
                    <span className="building-count"> (建造中: {existingRooms.length - builtRooms.length})</span>
                  )}
                </div>
                
                <div className="room-cost">
                  {Object.entries(cost).map(([resource, amount]) => {
                    const currentAmount = resources[resource as keyof Resources] || 0;
                    const hasEnough = currentAmount >= (amount || 0);
                    return (
                      <span key={resource} className={`cost-item ${hasEnough ? 'sufficient' : 'insufficient'}`}>
                        {getResourceIcon(resource)} {formatNumber(amount || 0)}
                        <span className="current-amount">({formatNumber(currentAmount)})</span>
                      </span>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => onBuildRoom(type)}
                  disabled={!canAfford}
                  className={`build-button ${canAfford ? 'can-afford' : 'cannot-afford'}`}
                  title={canAfford ? '点击建造' : '资源不足，无法建造'}
                >
                  {canAfford ? '建造' : '资源不足'}
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

const getRoomTypeName = (roomType: Room['type']): string => {
  const roomNames = {
    farm: '农场',
    water_plant: '净水厂',
    power_station: '发电站',
    workshop: '工坊',
    workbench: '工作台',
    quarters: '宿舍',
    medical: '医疗室',
    basic_laboratory: '研究台',
    laboratory: '高级实验室',
    armory: '军械库',
    training_room: '训练室',
    warehouse: '仓库',
    water_tank: '蓄水池',
    power_bank: '储能站',
    vault: '金库',
  };
  return roomNames[roomType] || roomType;
};

export default RoomPanel;