import React from 'react';
import { Resident, Room } from '../types';
import './ResidentPanel.css';

interface ResidentPanelProps {
  residents: Resident[];
  rooms: Room[];
  onAssignWorker: (residentId: string, roomId: string) => void;
  onRecruitResident: () => void;
}

const ResidentPanel: React.FC<ResidentPanelProps> = ({ 
  residents, 
  rooms, 
  onAssignWorker, 
  onRecruitResident 
}) => {
  const getSkillColor = (level: number) => {
    if (level >= 8) return '#4CAF50';
    if (level >= 6) return '#FF9800';
    if (level >= 4) return '#2196F3';
    return '#9E9E9E';
  };

  const getAvailableRooms = (residentId: string) => {
    return rooms.filter(room => 
      !room.isBuilding && 
      room.workers.length < room.maxWorkers &&
      !room.workers.includes(residentId)
    );
  };

  const getRoomName = (roomType: Room['type']) => {
    const names = {
      farm: '农场',
      water_plant: '净水厂', 
      power_station: '发电站',
      workshop: '工坊',
      quarters: '宿舍',
      medical: '医疗室',
      laboratory: '实验室',
      armory: '军械库',
      training_room: '训练室',
    };
    return names[roomType];
  };

  return (
    <div className="card">
      <div className="panel-header">
        <h2>居民管理</h2>
        <button onClick={onRecruitResident} className="recruit-button">
          招募新居民
        </button>
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
                <h4>技能等级</h4>
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
                  } else if (assignedRoom) {
                    return (
                      <div className="current-assignment">
                        <strong>当前工作:</strong> {getRoomName(assignedRoom.type)}
                      </div>
                    );
                  } else {
                    return (
                      <div className="assignment-controls">
                        <label>分配工作:</label>
                        <select 
                          onChange={(e) => {
                            if (e.target.value) {
                              onAssignWorker(resident.id, e.target.value);
                            }
                          }}
                          defaultValue=""
                        >
                          <option value="">选择设施</option>
                          {availableRooms.map(room => (
                            <option key={room.id} value={room.id}>
                              {getRoomName(room.type)} ({room.workers.length}/{room.maxWorkers})
                            </option>
                          ))}
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