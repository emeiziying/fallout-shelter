import { useState, useEffect, useCallback } from 'react';
import { GameState, Resources, Room, Resident } from '../types';
import { initialGameState } from '../data/initialState';
import { calculateResourceProduction, calculateResourceLimits, calculateMaxPopulation } from '../utils/gameLogic';

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>(initialGameState);

  const updateResources = useCallback((deltaTime: number) => {
    setGameState(prevState => {
      const production = calculateResourceProduction(prevState);
      const resourceLimits = calculateResourceLimits(prevState);
      const resourceIncrease: Resources = {
        food: production.food * deltaTime,
        water: production.water * deltaTime,
        power: production.power * deltaTime,
        materials: production.materials * deltaTime,
        components: production.components * deltaTime,
        chemicals: production.chemicals * deltaTime,
        money: production.money * deltaTime,
        research: production.research * deltaTime,
      };

      // 处理建造进度和自动分配建造工人
      const updatedRooms = prevState.rooms.map(room => {
        if (!room.isBuilding) return room;

        // 自动分配没有具体工作地点的工人参与建造
        const idleWorkers = prevState.residents.filter(r => 
          !r.assignedRoom && !room.buildWorkers.includes(r.id)
        ).slice(0, room.maxBuildWorkers - room.buildWorkers.length);
        
        const newBuildWorkers = [...room.buildWorkers, ...idleWorkers.map(w => w.id)];
        
        // 计算建造效率
        const buildEfficiency = calculateBuildEfficiency(room, prevState.residents, newBuildWorkers);
        const progressIncrease = buildEfficiency * deltaTime;
        const newProgress = Math.min(room.buildTime, room.buildProgress + progressIncrease);
        
        // 检查建造是否完成
        const isCompleted = newProgress >= room.buildTime;
        
        return {
          ...room,
          buildWorkers: isCompleted ? [] : newBuildWorkers,
          buildProgress: newProgress,
          isBuilding: !isCompleted,
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

      // 处理科技研发进度
      let updatedTechnologies = [...prevState.technologies];
      let completedTech = null;
      
      if (prevState.activeResearch) {
        const techIndex = updatedTechnologies.findIndex(t => t.id === prevState.activeResearch);
        if (techIndex !== -1) {
          const tech = updatedTechnologies[techIndex];
          const newProgress = tech.progress + (production.research * deltaTime);
          
          if (newProgress >= tech.researchTime) {
            // 研发完成
            updatedTechnologies[techIndex] = {
              ...tech,
              progress: tech.researchTime,
              isResearched: true,
              isResearching: false,
            };
            completedTech = tech;
          } else {
            updatedTechnologies[techIndex] = {
              ...tech,
              progress: newProgress,
            };
          }
        }
      }

      // 应用科技效果
      let newUnlockedRooms = [...prevState.unlockedRooms];
      if (completedTech) {
        completedTech.unlocks.forEach(roomType => {
          if (!newUnlockedRooms.includes(roomType as any)) {
            newUnlockedRooms.push(roomType as any);
          }
        });
      }

      const maxPopulation = calculateMaxPopulation(prevState);

      // 计算新的资源值
      const newResources = {
        food: Math.max(0, Math.min(resourceLimits.food, prevState.resources.food + resourceIncrease.food)),
        water: Math.max(0, Math.min(resourceLimits.water, prevState.resources.water + resourceIncrease.water)),
        power: Math.max(0, Math.min(resourceLimits.power, prevState.resources.power + resourceIncrease.power)),
        materials: Math.max(0, Math.min(resourceLimits.materials, prevState.resources.materials + resourceIncrease.materials)),
        components: Math.max(0, Math.min(resourceLimits.components, prevState.resources.components + resourceIncrease.components)),
        chemicals: Math.max(0, Math.min(resourceLimits.chemicals, prevState.resources.chemicals + resourceIncrease.chemicals)),
        money: Math.max(0, Math.min(resourceLimits.money, prevState.resources.money + resourceIncrease.money)),
        research: Math.max(0, Math.min(resourceLimits.research, prevState.resources.research + resourceIncrease.research)),
      };

      // 应用资源短缺惩罚
      const penalizedResidents = applyResourceShortageEffects(updatedResidents, newResources, deltaTime);

      return {
        ...prevState,
        residents: penalizedResidents,
        rooms: updatedRooms,
        technologies: updatedTechnologies,
        unlockedRooms: newUnlockedRooms,
        activeResearch: completedTech ? undefined : prevState.activeResearch,
        maxPopulation: maxPopulation,
        resources: newResources,
        resourcesPerSecond: production,
        resourceLimits: resourceLimits,
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

      // 检查是否有没有分配到具体工作地点的居民（可以参与建造）
      const availableForBuilding = prevState.residents.filter(r => !r.assignedRoom);
      
      if (availableForBuilding.length === 0) {
        // 不阻止建造，只是后续不会有工人自动分配
        // 可以在这里添加轻提醒逻辑
      }

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

      const updatedState = {
        ...prevState,
        resources: newResources,
        rooms: [...prevState.rooms, newRoom],
      };

      return {
        ...updatedState,
        maxPopulation: calculateMaxPopulation(updatedState),
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

      // 先从之前的工作岗位移除
      const updatedRooms = prevState.rooms.map(r => {
        if (r.workers.includes(residentId)) {
          return { ...r, workers: r.workers.filter(id => id !== residentId) };
        }
        if (r.id === roomId) {
          return { ...r, workers: [...r.workers, residentId] };
        }
        return r;
      });

      const updatedResidents = prevState.residents.map(r =>
        r.id === residentId
          ? { ...r, assignedRoom: roomId, isWorking: true }
          : r
      );

      return {
        ...prevState,
        residents: updatedResidents,
        rooms: updatedRooms,
      };
    });
  }, []);

  const unassignWorker = useCallback((residentId: string) => {
    setGameState(prevState => {
      const updatedResidents = prevState.residents.map(r =>
        r.id === residentId
          ? { ...r, assignedRoom: undefined, isWorking: false }
          : r
      );

      const updatedRooms = prevState.rooms.map(r => ({
        ...r,
        workers: r.workers.filter(id => id !== residentId),
      }));

      return {
        ...prevState,
        residents: updatedResidents,
        rooms: updatedRooms,
      };
    });
  }, []);

  const upgradeRoom = useCallback((roomId: string) => {
    setGameState(prevState => {
      const room = prevState.rooms.find(r => r.id === roomId);
      if (!room || room.isBuilding) return prevState;

      // 检查是否能负担升级成本
      const canAfford = Object.entries(room.upgradeCost).every(
        ([resource, cost]) => prevState.resources[resource as keyof Resources] >= (cost || 0)
      );

      if (!canAfford) return prevState;

      // 扣除升级成本
      const newResources = { ...prevState.resources };
      Object.entries(room.upgradeCost).forEach(([resource, cost]) => {
        newResources[resource as keyof Resources] -= cost || 0;
      });

      // 升级房间
      const updatedRooms = prevState.rooms.map(r => {
        if (r.id === roomId) {
          const newLevel = r.level + 1;
          const roomData = getRoomData(r.type);
          
          return {
            ...r,
            level: newLevel,
            maxWorkers: Math.min(r.maxWorkers + 1, roomData.maxWorkers + Math.floor(newLevel / 2)), // 每升级增加工人位，有上限
            production: {
              ...r.production,
              rate: roomData.production.rate * (1 + newLevel * 0.2), // 每级提升20%生产率
            },
            upgradeCost: {
              ...roomData.upgradeCost,
              // 升级成本随等级递增
              ...Object.fromEntries(
                Object.entries(roomData.upgradeCost).map(([resource, cost]) => [
                  resource,
                  Math.ceil((cost || 0) * Math.pow(1.5, newLevel - 1))
                ])
              )
            }
          };
        }
        return r;
      });

      const updatedState = {
        ...prevState,
        resources: newResources,
        rooms: updatedRooms,
      };

      return {
        ...updatedState,
        maxPopulation: calculateMaxPopulation(updatedState),
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

      const updatedState = {
        ...prevState,
        resources: refundResources,
        rooms: updatedRooms,
        residents: updatedResidents,
      };

      return {
        ...updatedState,
        maxPopulation: calculateMaxPopulation(updatedState),
      };
    });
  }, []);

  const recruitResident = useCallback(() => {
    setGameState(prevState => {
      const recruitCost = getRecruitCost(prevState.population);
      
      // 检查是否有足够的金钱和食物
      if (prevState.resources.money < recruitCost.money || 
          prevState.resources.food < recruitCost.food ||
          prevState.population >= prevState.maxPopulation) {
        return prevState;
      }

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

      return {
        ...prevState,
        residents: [...prevState.residents, newResident],
        population: prevState.population + 1,
        resources: {
          ...prevState.resources,
          money: prevState.resources.money - recruitCost.money,
          food: prevState.resources.food - recruitCost.food,
        },
      };
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      updateResources(1);
    }, 1000);

    return () => clearInterval(interval);
  }, [updateResources]);

  const getRecruitmentCost = useCallback(() => {
    return getRecruitCost(gameState.population);
  }, [gameState.population]);

  const canRecruitResident = useCallback(() => {
    const cost = getRecruitCost(gameState.population);
    return gameState.resources.money >= cost.money && 
           gameState.resources.food >= cost.food &&
           gameState.population < gameState.maxPopulation;
  }, [gameState.resources, gameState.population, gameState.maxPopulation]);

  const startResearch = useCallback((techId: string) => {
    setGameState(prevState => {
      const tech = prevState.technologies.find(t => t.id === techId);
      if (!tech || tech.isResearched || tech.isResearching || prevState.activeResearch) {
        return prevState;
      }

      // 检查前置条件
      const canResearch = tech.requirements.every(reqId => 
        prevState.technologies.find(t => t.id === reqId)?.isResearched
      );

      if (!canResearch) return prevState;

      // 检查是否有足够的研究点
      const canAfford = Object.entries(tech.cost).every(([resource, cost]) => 
        prevState.resources[resource as keyof Resources] >= (cost || 0)
      );

      if (!canAfford) return prevState;

      // 扣除研究成本
      const newResources = { ...prevState.resources };
      Object.entries(tech.cost).forEach(([resource, cost]) => {
        newResources[resource as keyof Resources] -= cost || 0;
      });

      // 更新科技状态
      const updatedTech = prevState.technologies.map(t =>
        t.id === techId ? { ...t, isResearching: true } : t
      );

      return {
        ...prevState,
        resources: newResources,
        technologies: updatedTech,
        activeResearch: techId,
      };
    });
  }, []);

  const canStartResearch = useCallback((techId: string) => {
    const tech = gameState.technologies.find(t => t.id === techId);
    if (!tech || tech.isResearched || tech.isResearching || gameState.activeResearch) {
      return false;
    }

    // 检查前置条件
    const prereqsMet = tech.requirements.every(reqId => 
      gameState.technologies.find(t => t.id === reqId)?.isResearched
    );

    // 检查资源
    const canAfford = Object.entries(tech.cost).every(([resource, cost]) => 
      gameState.resources[resource as keyof Resources] >= (cost || 0)
    );

    return prereqsMet && canAfford;
  }, [gameState.technologies, gameState.activeResearch, gameState.resources]);

  return {
    gameState,
    buildRoom,
    upgradeRoom,
    cancelBuild,
    assignWorker,
    unassignWorker,
    recruitResident,
    updateResources,
    getRecruitmentCost,
    canRecruitResident,
    startResearch,
    canStartResearch,
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
    workbench: {
      maxWorkers: 2,
      production: { resource: 'components' as const, rate: 0.2 },
      cost: { materials: 40 },
      upgradeCost: { materials: 80, components: 10 },
      buildTime: 12,
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
      production: { resource: 'research' as const, rate: 1.0 },
      cost: { materials: 100, components: 15, chemicals: 10 },
      upgradeCost: { materials: 200, components: 40 },
      buildTime: 25,
    },
    armory: {
      maxWorkers: 2,
      production: { resource: 'components' as const, rate: 0.4 },
      cost: { materials: 90, components: 15 },
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
    warehouse: {
      maxWorkers: 1,
      production: { resource: 'materials' as const, rate: 0 },
      cost: { materials: 100, money: 200 },
      upgradeCost: { materials: 200, money: 400 },
      buildTime: 20,
    },
    water_tank: {
      maxWorkers: 1,
      production: { resource: 'water' as const, rate: 0 },
      cost: { materials: 80, components: 15 },
      upgradeCost: { materials: 160, components: 30 },
      buildTime: 15,
    },
    power_bank: {
      maxWorkers: 1,
      production: { resource: 'power' as const, rate: 0 },
      cost: { materials: 120, components: 25 },
      upgradeCost: { materials: 240, components: 50 },
      buildTime: 18,
    },
    vault: {
      maxWorkers: 2,
      production: { resource: 'money' as const, rate: 0.5 },
      cost: { materials: 150, components: 30, money: 300 },
      upgradeCost: { materials: 300, components: 60 },
      buildTime: 25,
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

const getRecruitCost = (currentPopulation: number) => {
  const baseMoney = 100;
  const baseFood = 20;
  const multiplier = Math.pow(1.5, currentPopulation - 3); // 基于初始3人计算
  
  return {
    money: Math.ceil(baseMoney * multiplier),
    food: Math.ceil(baseFood * multiplier),
  };
};

const applyResourceShortageEffects = (residents: Resident[], resources: Resources, deltaTime: number): Resident[] => {
  return residents.map(resident => {
    let newResident = { ...resident };
    
    // 食物短缺影响健康和幸福度
    if (resources.food <= 0) {
      newResident.health = Math.max(0, newResident.health - 5 * deltaTime);
      newResident.happiness = Math.max(0, newResident.happiness - 3 * deltaTime);
    } else if (resources.food < 20) {
      newResident.happiness = Math.max(0, newResident.happiness - 1 * deltaTime);
    }
    
    // 水源短缺影响健康
    if (resources.water <= 0) {
      newResident.health = Math.max(0, newResident.health - 8 * deltaTime);
      newResident.happiness = Math.max(0, newResident.happiness - 5 * deltaTime);
    } else if (resources.water < 15) {
      newResident.health = Math.max(0, newResident.health - 2 * deltaTime);
    }
    
    // 电力短缺影响幸福度和工作效率
    if (resources.power <= 0) {
      newResident.happiness = Math.max(0, newResident.happiness - 2 * deltaTime);
    }
    
    return newResident;
  });
};

const generateRandomName = () => {
  const firstNames = ['张伟', '李娜', '王芳', '刘洋', '陈静', '杨明', '赵雷', '孙丽', '周强', '吴敏'];
  const lastNames = ['博士', '工程师', '医生', '队长', '专家', '技师', '研究员', '主管', '助理', '顾问'];
  
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  
  return `${firstName}${lastName}`;
};