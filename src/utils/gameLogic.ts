import { GameState, Resources, ResourceLimits, Room, Resident } from '../types';

export const calculateResourceProduction = (gameState: GameState): Resources => {
  const production: Resources = {
    food: 0,
    water: 0,
    power: 0,
    materials: 0,
    components: 0,
    chemicals: 0,
    money: 0,
    research: 0,
  };

  // 计算生产
  gameState.rooms.forEach(room => {
    if (room.isBuilding || room.workers.length === 0) return;

    const efficiency = calculateRoomEfficiency(room, gameState.residents);
    const resourceKey = room.production.resource;
    production[resourceKey] += room.production.rate * efficiency;
  });

  // 计算消耗
  const consumption = calculateResourceConsumption(gameState);
  
  // 净生产 = 生产 - 消耗
  Object.keys(production).forEach(resource => {
    const key = resource as keyof Resources;
    production[key] -= consumption[key];
  });

  return production;
};

export const calculateRoomEfficiency = (room: Room, residents: Resident[]): number => {
  if (room.workers.length === 0) return 0;

  const workers = residents.filter(r => room.workers.includes(r.id));
  let totalSkill = 0;
  let workerCount = 0;

  workers.forEach(worker => {
    const relevantSkill = getRelevantSkill(room.type, worker);
    const happinessBonus = (worker.happiness - 50) / 100;
    const healthPenalty = worker.health < 50 ? (50 - worker.health) / 100 : 0;
    
    const workerEfficiency = (relevantSkill / 10) + happinessBonus - healthPenalty;
    totalSkill += Math.max(0.1, Math.min(2.0, workerEfficiency));
    workerCount++;
  });

  const baseEfficiency = workerCount > 0 ? totalSkill / workerCount : 0;
  const workerRatio = workerCount / room.maxWorkers;
  
  return baseEfficiency * (0.5 + 0.5 * workerRatio);
};

export const calculateResourceLimits = (gameState: GameState): ResourceLimits => {
  const baseLimits = {
    food: 500,
    water: 300,
    power: 200,
    materials: 1000,
    components: 100,
    chemicals: 50,
    money: 10000,
    research: 1000,
  };

  const limits = { ...baseLimits };

  // 计算仓库和存储设施的加成
  gameState.rooms.forEach(room => {
    if (room.isBuilding) return;
    
    switch (room.type) {
      case 'warehouse':
        limits.food += 300 * room.level;
        limits.materials += 500 * room.level;
        limits.components += 50 * room.level;
        break;
      case 'water_tank':
        limits.water += 200 * room.level;
        break;
      case 'power_bank':
        limits.power += 150 * room.level;
        break;
      case 'vault':
        limits.money += 5000 * room.level;
        break;
    }
  });

  return limits;
};

export const calculateMaxPopulation = (gameState: GameState): number => {
  const basePopulation = 3; // 基础人口容量
  let additionalCapacity = 0;

  // 计算宿舍提供的额外人口容量
  gameState.rooms.forEach(room => {
    if (room.type === 'quarters' && !room.isBuilding) {
      additionalCapacity += 4 * room.level; // 每级宿舍提供4个人口位
    }
  });

  return basePopulation + additionalCapacity;
};

export const getRelevantSkill = (roomType: Room['type'], resident: Resident): number => {
  const skillMapping = {
    farm: resident.skills.management,
    water_plant: resident.skills.engineering,
    power_station: resident.skills.engineering,
    workshop: resident.skills.engineering,
    workbench: resident.skills.engineering,
    quarters: resident.skills.management,
    medical: resident.skills.medical,
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

export const canAffordCost = (resources: Resources, cost: Partial<Resources>): boolean => {
  return Object.entries(cost).every(([resource, amount]) => {
    return resources[resource as keyof Resources] >= (amount || 0);
  });
};

export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return Math.floor(num).toString();
};

export const formatProductionRate = (num: number): string => {
  if (num === 0) return '0.00';
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(2) + 'K';
  }
  return num.toFixed(2);
};

export const calculateResourceConsumption = (gameState: GameState): Resources => {
  const consumption: Resources = {
    food: 0,
    water: 0,
    power: 0,
    materials: 0,
    components: 0,
    chemicals: 0,
    money: 0,
    research: 0,
  };

  // 居民消耗
  const populationCount = gameState.population;
  consumption.food += populationCount * 0.1; // 每人每秒消耗0.1食物
  consumption.water += populationCount * 0.08; // 每人每秒消耗0.08水

  // 设施电力消耗
  gameState.rooms.forEach(room => {
    if (room.isBuilding) return;
    
    // 根据设施类型计算电力消耗
    const powerConsumption = getRoomPowerConsumption(room.type);
    consumption.power += powerConsumption * room.level;
  });

  return consumption;
};

export const getRoomPowerConsumption = (roomType: Room['type']): number => {
  const powerConsumption = {
    farm: 0.05,
    water_plant: 0.08,
    power_station: 0, // 发电站不消耗电力
    workshop: 0.06,
    workbench: 0.03,
    quarters: 0.02,
    medical: 0.04,
    laboratory: 0.1,
    armory: 0.05,
    training_room: 0.04,
    warehouse: 0.02,
    water_tank: 0.01,
    power_bank: 0, // 储能站不消耗电力
    vault: 0.03,
  };

  return powerConsumption[roomType] || 0;
};

export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};