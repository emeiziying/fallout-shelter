import { useState, useEffect, useCallback } from 'react';
import { GameState, Resources, Room, Resident } from '../types';
import { initialGameState } from '../data/initialState';
import { calculateResourceProduction } from '../utils/gameLogic';

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>(initialGameState);

  const updateResources = useCallback((deltaTime: number) => {
    setGameState(prevState => {
      const production = calculateResourceProduction(prevState);
      const resourceIncrease: Resources = {
        food: production.food * deltaTime,
        water: production.water * deltaTime,
        power: production.power * deltaTime,
        materials: production.materials * deltaTime,
        components: production.components * deltaTime,
        chemicals: production.chemicals * deltaTime,
      };

      // 处理建造进度和自动分配建造工人
      const updatedRooms = prevState.rooms.map(room => {
        if (!room.isBuilding) return room;

        // 自动分配空闲工人参与建造
        const idleWorkers = prevState.residents.filter(r => 
          !r.isWorking && !room.buildWorkers.includes(r.id)
        ).slice(0, room.maxBuildWorkers - room.buildWorkers.length);
        
        const newBuildWorkers = [...room.buildWorkers, ...idleWorkers.map(w => w.id)];
        
        // 计算建造效率
        const buildEfficiency = calculateBuildEfficiency(room, prevState.residents, newBuildWorkers);
        const progressIncrease = buildEfficiency * deltaTime;
        const newProgress = Math.min(room.buildTime, room.buildProgress + progressIncrease);
        
        return {
          ...room,
          buildWorkers: newBuildWorkers,
          buildProgress: newProgress,
          isBuilding: newProgress < room.buildTime,
        };
      });

      // 更新居民状态（参与建造的标记为工作中）
      const updatedResidents = prevState.residents.map(resident => {
        const isBuildWorker = updatedRooms.some(room => 
          room.isBuilding && room.buildWorkers.includes(resident.id)
        );
        const isRoomWorker = updatedRooms.some(room => 
          !room.isBuilding && room.workers.includes(resident.id)
        );
        
        return {
          ...resident,
          isWorking: isBuildWorker || isRoomWorker,
        };
      });

      return {
        ...prevState,
        residents: updatedResidents,
        rooms: updatedRooms,
        resources: {
          food: Math.max(0, prevState.resources.food + resourceIncrease.food),
          water: Math.max(0, prevState.resources.water + resourceIncrease.water),
          power: Math.max(0, prevState.resources.power + resourceIncrease.power),
          materials: Math.max(0, prevState.resources.materials + resourceIncrease.materials),
          components: Math.max(0, prevState.resources.components + resourceIncrease.components),
          chemicals: Math.max(0, prevState.resources.chemicals + resourceIncrease.chemicals),
        },
        resourcesPerSecond: production,
        gameTime: prevState.gameTime + deltaTime,
        lastUpdate: Date.now(),
      };
    });
  }, []);

  const buildRoom = useCallback((roomType: Room['type']) => {
    setGameState(prevState => {
      const roomData = getRoomData(roomType);
      const canAfford = Object.entries(roomData.cost).every(
        ([resource, cost]) => prevState.resources[resource as keyof Resources] >= (cost || 0)
      );

      if (!canAfford) return prevState;

      const newRoom: Room = {
        id: `${roomType}_${Date.now()}`,
        type: roomType,
        level: 1,
        workers: [],
        maxWorkers: roomData.maxWorkers,
        production: roomData.production,
        cost: roomData.cost,
        upgradeCost: roomData.upgradeCost,
        isBuilding: true,
        buildTime: roomData.buildTime || 10,
        buildProgress: 0,
        buildWorkers: [],
        maxBuildWorkers: 3,
      };

      const newResources = { ...prevState.resources };
      Object.entries(roomData.cost).forEach(([resource, cost]) => {
        newResources[resource as keyof Resources] -= cost || 0;
      });

      return {
        ...prevState,
        resources: newResources,
        rooms: [...prevState.rooms, newRoom],
      };
    });
  }, []);

  const assignWorker = useCallback((residentId: string, roomId: string) => {
    setGameState(prevState => {
      const resident = prevState.residents.find(r => r.id === residentId);
      const room = prevState.rooms.find(r => r.id === roomId);

      if (!resident || !room || room.workers.length >= room.maxWorkers) {
        return prevState;
      }

      const updatedResidents = prevState.residents.map(r =>
        r.id === residentId
          ? { ...r, assignedRoom: roomId, isWorking: true }
          : r
      );

      const updatedRooms = prevState.rooms.map(r =>
        r.id === roomId
          ? { ...r, workers: [...r.workers, residentId] }
          : r
      );

      return {
        ...prevState,
        residents: updatedResidents,
        rooms: updatedRooms,
      };
    });
  }, []);

  const cancelBuild = useCallback((roomId: string) => {
    setGameState(prevState => {
      const room = prevState.rooms.find(r => r.id === roomId);
      if (!room || !room.isBuilding) return prevState;

      // 返还资源
      const refundResources = { ...prevState.resources };
      Object.entries(room.cost).forEach(([resource, cost]) => {
        refundResources[resource as keyof Resources] += cost || 0;
      });

      // 移除房间
      const updatedRooms = prevState.rooms.filter(r => r.id !== roomId);

      // 释放建造工人
      const updatedResidents = prevState.residents.map(resident => {
        if (room.buildWorkers.includes(resident.id)) {
          return { ...resident, isWorking: false };
        }
        return resident;
      });

      return {
        ...prevState,
        resources: refundResources,
        rooms: updatedRooms,
        residents: updatedResidents,
      };
    });
  }, []);

  const recruitResident = useCallback(() => {
    const newResident: Resident = {
      id: `resident_${Date.now()}`,
      name: generateRandomName(),
      skills: {
        engineering: Math.floor(Math.random() * 10) + 1,
        medical: Math.floor(Math.random() * 10) + 1,
        combat: Math.floor(Math.random() * 10) + 1,
        exploration: Math.floor(Math.random() * 10) + 1,
        research: Math.floor(Math.random() * 10) + 1,
        management: Math.floor(Math.random() * 10) + 1,
      },
      happiness: 80 + Math.floor(Math.random() * 20),
      health: 90 + Math.floor(Math.random() * 10),
      age: 18 + Math.floor(Math.random() * 47),
      isWorking: false,
    };

    setGameState(prevState => ({
      ...prevState,
      residents: [...prevState.residents, newResident],
      population: prevState.population + 1,
    }));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      updateResources(1);
    }, 1000);

    return () => clearInterval(interval);
  }, [updateResources]);

  return {
    gameState,
    buildRoom,
    cancelBuild,
    assignWorker,
    recruitResident,
    updateResources,
  };
};

const getRoomData = (roomType: Room['type']) => {
  const roomConfigs = {
    farm: {
      maxWorkers: 3,
      production: { resource: 'food' as const, rate: 1.0 },
      cost: { materials: 50, power: 20 },
      upgradeCost: { materials: 100, components: 10 },
      buildTime: 15,
    },
    water_plant: {
      maxWorkers: 2,
      production: { resource: 'water' as const, rate: 1.2 },
      cost: { materials: 40, components: 5 },
      upgradeCost: { materials: 80, components: 15 },
      buildTime: 12,
    },
    power_station: {
      maxWorkers: 2,
      production: { resource: 'power' as const, rate: 2.0 },
      cost: { materials: 60, components: 10 },
      upgradeCost: { materials: 120, components: 20 },
      buildTime: 18,
    },
    workshop: {
      maxWorkers: 4,
      production: { resource: 'materials' as const, rate: 0.8 },
      cost: { materials: 80, power: 30 },
      upgradeCost: { materials: 160, components: 25 },
      buildTime: 20,
    },
    quarters: {
      maxWorkers: 0,
      production: { resource: 'food' as const, rate: 0 },
      cost: { materials: 30 },
      upgradeCost: { materials: 60, components: 5 },
      buildTime: 10,
    },
    medical: {
      maxWorkers: 2,
      production: { resource: 'chemicals' as const, rate: 0.3 },
      cost: { materials: 70, components: 15 },
      upgradeCost: { materials: 140, components: 30 },
      buildTime: 16,
    },
    laboratory: {
      maxWorkers: 3,
      production: { resource: 'components' as const, rate: 0.5 },
      cost: { materials: 100, components: 20, chemicals: 10 },
      upgradeCost: { materials: 200, components: 40 },
      buildTime: 25,
    },
    armory: {
      maxWorkers: 2,
      production: { resource: 'components' as const, rate: 0.4 },
      cost: { materials: 90, components: 25 },
      upgradeCost: { materials: 180, components: 50 },
      buildTime: 22,
    },
    training_room: {
      maxWorkers: 4,
      production: { resource: 'food' as const, rate: 0 },
      cost: { materials: 60, components: 10 },
      upgradeCost: { materials: 120, components: 20 },
      buildTime: 14,
    },
  };

  return roomConfigs[roomType];
};

const calculateBuildEfficiency = (room: Room, residents: Resident[], buildWorkers: string[]): number => {
  if (buildWorkers.length === 0) return 0;

  const workers = residents.filter(r => buildWorkers.includes(r.id));
  let totalEfficiency = 0;

  workers.forEach(worker => {
    const engineeringSkill = worker.skills.engineering;
    const happinessBonus = (worker.happiness - 50) / 200; // -0.25 to +0.25
    const healthPenalty = worker.health < 50 ? (50 - worker.health) / 200 : 0;
    
    const workerEfficiency = (engineeringSkill / 10) + happinessBonus - healthPenalty;
    totalEfficiency += Math.max(0.1, Math.min(1.5, workerEfficiency));
  });

  return totalEfficiency / workers.length; // 平均效率
};

const generateRandomName = () => {
  const firstNames = ['张伟', '李娜', '王芳', '刘洋', '陈静', '杨明', '赵雷', '孙丽', '周强', '吴敏'];
  const lastNames = ['博士', '工程师', '医生', '队长', '专家', '技师', '研究员', '主管', '助理', '顾问'];
  
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  
  return `${firstName}${lastName}`;
};