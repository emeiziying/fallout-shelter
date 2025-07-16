import { GameState, SaveGame, SaveSlot } from '../types';

const SAVE_PREFIX = 'fallout_shelter_save_';
const SAVE_SLOTS_KEY = 'fallout_shelter_save_slots';
const GAME_VERSION = '1.0.0';
const MAX_SAVE_SLOTS = 3;

export class SaveService {
  private static instance: SaveService;
  
  private constructor() {}
  
  static getInstance(): SaveService {
    if (!SaveService.instance) {
      SaveService.instance = new SaveService();
    }
    return SaveService.instance;
  }

  /**
   * 保存游戏到指定槽位
   */
  saveGame(gameState: GameState, slotId: number, saveName?: string): boolean {
    try {
      const saveId = `${SAVE_PREFIX}${slotId}`;
      const timestamp = Date.now();
      
      // 计算元数据
      const metadata = this.calculateMetadata(gameState);
      
      const saveGame: SaveGame = {
        id: saveId,
        name: saveName || `存档 ${slotId}`,
        timestamp,
        version: GAME_VERSION,
        gameState: this.cloneGameState(gameState),
        metadata,
      };

      // 保存到localStorage
      localStorage.setItem(saveId, JSON.stringify(saveGame));
      
      // 更新槽位信息
      this.updateSaveSlot(slotId, saveGame);
      
      return true;
    } catch (error) {
      console.error('保存游戏失败:', error);
      return false;
    }
  }

  /**
   * 从指定槽位加载游戏
   */
  loadGame(slotId: number): GameState | null {
    try {
      const saveId = `${SAVE_PREFIX}${slotId}`;
      const saveData = localStorage.getItem(saveId);
      
      if (!saveData) {
        return null;
      }

      const saveGame: SaveGame = JSON.parse(saveData);
      
      // 版本兼容性检查
      if (!this.isVersionCompatible(saveGame.version)) {
        console.warn(`存档版本 ${saveGame.version} 与当前版本 ${GAME_VERSION} 不兼容`);
        return null;
      }

      // 修复时间戳，确保游戏继续运行
      const gameState = saveGame.gameState;
      gameState.lastUpdate = Date.now();
      
      return gameState;
    } catch (error) {
      console.error('加载游戏失败:', error);
      return null;
    }
  }

  /**
   * 删除指定槽位的存档
   */
  deleteGame(slotId: number): boolean {
    try {
      const saveId = `${SAVE_PREFIX}${slotId}`;
      localStorage.removeItem(saveId);
      
      // 更新槽位信息
      this.updateSaveSlot(slotId, null);
      
      return true;
    } catch (error) {
      console.error('删除存档失败:', error);
      return false;
    }
  }

  /**
   * 获取所有存档槽位
   */
  getSaveSlots(): SaveSlot[] {
    try {
      const slotsData = localStorage.getItem(SAVE_SLOTS_KEY);
      let slots: SaveSlot[] = [];
      
      if (slotsData) {
        slots = JSON.parse(slotsData);
      }
      
      // 确保有足够的槽位
      while (slots.length < MAX_SAVE_SLOTS) {
        slots.push({
          id: slots.length + 1,
          name: `存档槽位 ${slots.length + 1}`,
          isEmpty: true,
        });
      }
      
      return slots;
    } catch (error) {
      console.error('获取存档槽位失败:', error);
      return this.createEmptySlots();
    }
  }

  /**
   * 获取指定槽位的存档信息
   */
  getSaveInfo(slotId: number): SaveGame | null {
    try {
      const saveId = `${SAVE_PREFIX}${slotId}`;
      const saveData = localStorage.getItem(saveId);
      
      if (!saveData) {
        return null;
      }

      const saveGame: SaveGame = JSON.parse(saveData);
      return saveGame;
    } catch (error) {
      console.error('获取存档信息失败:', error);
      return null;
    }
  }

  /**
   * 自动保存游戏
   */
  autoSave(gameState: GameState): boolean {
    return this.saveGame(gameState, 0, '自动存档');
  }

  /**
   * 检查是否有自动存档
   */
  hasAutoSave(): boolean {
    const saveId = `${SAVE_PREFIX}0`;
    return localStorage.getItem(saveId) !== null;
  }

  /**
   * 导出存档到文件
   */
  exportSave(slotId: number): boolean {
    try {
      const saveGame = this.getSaveInfo(slotId);
      if (!saveGame) {
        return false;
      }

      const dataStr = JSON.stringify(saveGame, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${saveGame.name}_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.error('导出存档失败:', error);
      return false;
    }
  }

  /**
   * 从文件导入存档
   */
  importSave(file: File, slotId: number): Promise<boolean> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const saveData = JSON.parse(e.target?.result as string);
          
          // 验证存档格式
          if (!this.validateSaveFormat(saveData)) {
            resolve(false);
            return;
          }

          // 更新保存ID和时间戳
          saveData.id = `${SAVE_PREFIX}${slotId}`;
          saveData.timestamp = Date.now();
          
          localStorage.setItem(saveData.id, JSON.stringify(saveData));
          this.updateSaveSlot(slotId, saveData);
          
          resolve(true);
        } catch (error) {
          console.error('导入存档失败:', error);
          resolve(false);
        }
      };
      reader.readAsText(file);
    });
  }

  /**
   * 清空所有存档
   */
  clearAllSaves(): boolean {
    try {
      for (let i = 1; i <= MAX_SAVE_SLOTS; i++) {
        this.deleteGame(i);
      }
      // 也删除自动存档
      this.deleteGame(0);
      return true;
    } catch (error) {
      console.error('清空存档失败:', error);
      return false;
    }
  }

  /**
   * 获取存档统计信息
   */
  getStorageStats(): { used: number; total: number; saves: number } {
    let used = 0;
    let saves = 0;
    
    // 只计算用户手动存档槽位（1-3），不包括自动存档（slot 0）
    for (let i = 1; i <= MAX_SAVE_SLOTS; i++) {
      const key = `${SAVE_PREFIX}${i}`;
      const data = localStorage.getItem(key);
      if (data) {
        saves++;
      }
    }
    
    // 计算所有存档的总存储使用量（包括自动存档）
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(SAVE_PREFIX)) {
        const data = localStorage.getItem(key);
        if (data) {
          used += data.length;
        }
      }
    }
    
    // 估算localStorage总容量 (通常5-10MB)
    const total = 5 * 1024 * 1024; // 5MB
    
    return { used, total, saves };
  }

  private calculateMetadata(gameState: GameState) {
    const totalResources = Object.values(gameState.resources).reduce((sum, val) => sum + val, 0);
    
    return {
      playTime: gameState.gameTime,
      population: gameState.population,
      shelterLevel: gameState.shelterLevel,
      totalResources: Math.floor(totalResources),
    };
  }

  private cloneGameState(gameState: GameState): GameState {
    return JSON.parse(JSON.stringify(gameState));
  }

  private isVersionCompatible(version: string): boolean {
    // 简单的版本兼容性检查
    const currentMajor = parseInt(GAME_VERSION.split('.')[0]);
    const saveMajor = parseInt(version.split('.')[0]);
    
    return currentMajor === saveMajor;
  }

  private updateSaveSlot(slotId: number, saveGame: SaveGame | null) {
    const slots = this.getSaveSlots();
    const slot = slots.find(s => s.id === slotId);
    
    if (slot) {
      if (saveGame) {
        slot.isEmpty = false;
        slot.saveGame = saveGame;
        slot.lastSaved = saveGame.timestamp;
      } else {
        slot.isEmpty = true;
        slot.saveGame = undefined;
        slot.lastSaved = undefined;
      }
    }
    
    localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(slots));
  }

  private createEmptySlots(): SaveSlot[] {
    const slots: SaveSlot[] = [];
    for (let i = 1; i <= MAX_SAVE_SLOTS; i++) {
      slots.push({
        id: i,
        name: `存档槽位 ${i}`,
        isEmpty: true,
      });
    }
    return slots;
  }

  private validateSaveFormat(data: any): boolean {
    return (
      data &&
      typeof data.id === 'string' &&
      typeof data.name === 'string' &&
      typeof data.timestamp === 'number' &&
      typeof data.version === 'string' &&
      data.gameState &&
      data.metadata
    );
  }
}

export const saveService = SaveService.getInstance();