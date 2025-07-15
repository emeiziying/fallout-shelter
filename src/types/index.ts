export interface Resources {
  food: number;
  water: number;
  power: number;
  materials: number;
  components: number;
  chemicals: number;
}

export interface Resident {
  id: string;
  name: string;
  skills: {
    engineering: number;
    medical: number;
    combat: number;
    exploration: number;
    research: number;
    management: number;
  };
  happiness: number;
  health: number;
  age: number;
  assignedRoom?: string;
  isWorking: boolean;
}

export interface Room {
  id: string;
  type: RoomType;
  level: number;
  workers: string[];
  maxWorkers: number;
  production: {
    resource: keyof Resources;
    rate: number;
  };
  cost: Partial<Resources>;
  upgradeCost: Partial<Resources>;
  isBuilding: boolean;
  buildTime: number;
  buildProgress: number;
  buildWorkers: string[];
  maxBuildWorkers: number;
}

export type RoomType = 
  | 'farm'
  | 'water_plant'
  | 'power_station'
  | 'workshop'
  | 'quarters'
  | 'medical'
  | 'laboratory'
  | 'armory'
  | 'training_room';

export interface Technology {
  id: string;
  name: string;
  description: string;
  cost: Partial<Resources>;
  researchTime: number;
  requirements: string[];
  unlocks: string[];
  effects: TechEffect[];
  isResearched: boolean;
  isResearching: boolean;
  progress: number;
}

export interface TechEffect {
  type: 'production_bonus' | 'resource_efficiency' | 'unlock_room' | 'unlock_tech';
  target: string;
  value: number;
}

export interface GameState {
  resources: Resources;
  resourcesPerSecond: Resources;
  residents: Resident[];
  rooms: Room[];
  technologies: Technology[];
  gameTime: number;
  lastUpdate: number;
  shelterLevel: number;
  population: number;
  maxPopulation: number;
}