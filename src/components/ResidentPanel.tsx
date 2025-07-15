import React from 'react';
import { Resident, Room } from '../types';
import './ResidentPanel.css';

interface ResidentPanelProps {
  residents: Resident[];
  rooms: Room[];
  onAssignWorker: (residentId: string, roomId: string) => void;
  onUnassignWorker: (residentId: string) => void;
  onRecruitResident: () => void;
  recruitmentCost: { money: number; food: number };
  canRecruit: boolean;
}

const ResidentPanel: React.FC<ResidentPanelProps> = ({ 
  residents, 
  rooms, 
  onAssignWorker, 
  onUnassignWorker,
  onRecruitResident,
  recruitmentCost,
  canRecruit
}) => {
  const getSkillColor = (level: number) => {
    if (level >= 8) return '#4CAF50';
    if (level >= 6) return '#FF9800';
    if (level >= 4) return '#2196F3';
    return '#9E9E9E';
  };

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

  const getAvailableRooms = (residentId: string) => {
    const resident = residents.find(r => r.id === residentId);
    if (!resident) return [];

    const availableRooms = rooms.filter(room => 
      !room.isBuilding && 
      (room.workers.length < room.maxWorkers || room.workers.includes(residentId))
    );

    // 按匹配度排序，最高分在前
    return availableRooms.sort((a, b) => {
      const scoreA = getJobMatchScore(a, resident);
      const scoreB = getJobMatchScore(b, resident);
      return scoreB - scoreA;
    });
  };

  const isRecommendedJob = (room: Room, resident: Resident): boolean => {
    const skill = getRelevantSkill(room.type, resident);
    return skill >= 7; // 技能7分以上视为推荐
  };

  const getRoomName = (roomType: Room['type']) => {
    const names = {
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
    return names[roomType];
  };

  return (
    <div className="card">
      <div className="panel-header">
        <h2>居民管理</h2>
        <div className="recruit-section">
          <div className="recruit-cost">
            <span>招募费用:</span>
            <span>💰 {recruitmentCost.money}</span>
            <span>🍞 {recruitmentCost.food}</span>
          </div>
          <button 
            onClick={onRecruitResident} 
            className="recruit-button"
            disabled={!canRecruit}
            title={!canRecruit ? "资源不足或人数已满" : "招募新居民"}
          >
            招募新居民
          </button>
        </div>
      </div>
      
      <div className="residents-grid">
        {residents.map(resident => {
          const availableRooms = getAvailableRooms(resident.id);
          const assignedRoom = rooms.find(room => room.workers.includes(resident.id));
          
          return (
            <div key={resident.id} className="resident-card">
              <div className="resident-header">
                <div className="resident-avatar">👤</div>
                <div className="resident-info">
                  <h3>{resident.name}</h3>
                  <div className="resident-stats">
                    <span>年龄: {resident.age}</span>
                    <span>健康: {resident.health}%</span>
                    <span>心情: {resident.happiness}%</span>
                  </div>
                </div>
              </div>

              <div className="skills-section">
                <div className="skills-header">
                  <h4>技能等级</h4>
                  {(() => {
                    const bestRoom = availableRooms.find(room => isRecommendedJob(room, resident));
                    if (bestRoom) {
                      return (
                        <div className="job-recommendation">
                          <span className="recommendation-label">推荐:</span>
                          <span className="recommendation-job">
                            ★ {getRoomName(bestRoom.type)}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
                <div className="skills-grid">
                  <div className="skill-item">
                    <span>工程</span>
                    <div className="skill-bar">
                      <div 
                        className="skill-fill"
                        style={{ 
                          width: `${resident.skills.engineering * 10}%`,
                          backgroundColor: getSkillColor(resident.skills.engineering)
                        }}
                      />
                      <span className="skill-value">{resident.skills.engineering}</span>
                    </div>
                  </div>
                  
                  <div className="skill-item">
                    <span>医疗</span>
                    <div className="skill-bar">
                      <div 
                        className="skill-fill"
                        style={{ 
                          width: `${resident.skills.medical * 10}%`,
                          backgroundColor: getSkillColor(resident.skills.medical)
                        }}
                      />
                      <span className="skill-value">{resident.skills.medical}</span>
                    </div>
                  </div>
                  
                  <div className="skill-item">
                    <span>战斗</span>
                    <div className="skill-bar">
                      <div 
                        className="skill-fill"
                        style={{ 
                          width: `${resident.skills.combat * 10}%`,
                          backgroundColor: getSkillColor(resident.skills.combat)
                        }}
                      />
                      <span className="skill-value">{resident.skills.combat}</span>
                    </div>
                  </div>
                  
                  <div className="skill-item">
                    <span>科研</span>
                    <div className="skill-bar">
                      <div 
                        className="skill-fill"
                        style={{ 
                          width: `${resident.skills.research * 10}%`,
                          backgroundColor: getSkillColor(resident.skills.research)
                        }}
                      />
                      <span className="skill-value">{resident.skills.research}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="assignment-section">
                {(() => {
                  const buildingRoom = rooms.find(room => room.buildWorkers.includes(resident.id));
                  if (buildingRoom) {
                    return (
                      <div className="current-assignment">
                        <strong>正在建造:</strong> {getRoomName(buildingRoom.type)}
                        <div className="build-progress-mini">
                          进度: {Math.round((buildingRoom.buildProgress / buildingRoom.buildTime) * 100)}%
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div className="assignment-controls">
                        <label>工作分配:</label>
                        <select 
                          value={assignedRoom?.id || ""}
                          onChange={(e) => {
                            if (e.target.value) {
                              onAssignWorker(resident.id, e.target.value);
                            } else {
                              onUnassignWorker(resident.id);
                            }
                          }}
                        >
                          <option value="">无工作</option>
                          {availableRooms.map(room => {
                            const isRecommended = isRecommendedJob(room, resident);
                            const skill = getRelevantSkill(room.type, resident);
                            const matchScore = getJobMatchScore(room, resident).toFixed(1);
                            
                            return (
                              <option 
                                key={room.id} 
                                value={room.id}
                                style={{
                                  backgroundColor: isRecommended ? '#e8f5e8' : 'inherit',
                                  fontWeight: isRecommended ? 'bold' : 'normal'
                                }}
                              >
                                {isRecommended ? '★ ' : ''}{getRoomName(room.type)} 
                                ({room.workers.length}/{room.maxWorkers}) 
                                [技能:{skill} 匹配:{matchScore}]
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    );
                  }
                })()}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default ResidentPanel;