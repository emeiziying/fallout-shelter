import { GameState, Resources, Room, Resident } from '../types';

export const calculateResourceProduction = (gameState: GameState): Resources => {
  const production: Resources = {
    food: 0,
    water: 0,
    power: 0,
    materials: 0,
    components: 0,
    chemicals: 0,
  };

  gameState.rooms.forEach(room => {
    if (room.isBuilding || room.workers.length === 0) return;

    const efficiency = calculateRoomEfficiency(room, gameState.residents);
    const resourceKey = room.production.resource;
    production[resourceKey] += room.production.rate * efficiency;
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

export const getRelevantSkill = (roomType: Room['type'], resident: Resident): number => {
  const skillMapping = {
    farm: resident.skills.management,
    water_plant: resident.skills.engineering,
    power_station: resident.skills.engineering,
    workshop: resident.skills.engineering,
    quarters: resident.skills.management,
    medical: resident.skills.medical,
    laboratory: resident.skills.research,
    armory: resident.skills.combat,
    training_room: resident.skills.combat,
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

export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};