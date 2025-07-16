import React, { useState, useEffect } from 'react';
import { SaveSlot } from '../types';
import { saveService } from '../services/saveService';
import './SavePanel.css';

interface SavePanelProps {
  onSaveGame: (slotId: number, saveName?: string) => boolean;
  onLoadGame: (slotId: number) => boolean;
  onSetAutoSaveEnabled: (enabled: boolean) => void;
}

const SavePanel: React.FC<SavePanelProps> = ({ onSaveGame, onLoadGame, onSetAutoSaveEnabled }) => {
  const [saveSlots, setSaveSlots] = useState<SaveSlot[]>([]);
  const [activeTab, setActiveTab] = useState<'save' | 'load'>('save');
  const [saveName, setSaveName] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    loadSaveSlots();
  }, []);

  const loadSaveSlots = () => {
    const slots = saveService.getSaveSlots();
    setSaveSlots(slots);
  };

  const handleSave = (slotId: number) => {
    const name = saveName.trim() || `存档 ${slotId}`;
    const success = onSaveGame(slotId, name);
    
    if (success) {
      showNotification('游戏保存成功！');
      loadSaveSlots();
      setSaveName('');
      setSelectedSlot(null);
    } else {
      showNotification('保存失败，请重试');
    }
  };

  const handleLoad = (slotId: number) => {
    const success = onLoadGame(slotId);
    
    if (success) {
      showNotification('游戏加载成功！');
    } else {
      showNotification('加载失败，存档可能已损坏');
    }
  };

  const handleDelete = (slotId: number) => {
    if (window.confirm('确定要删除这个存档吗？此操作不可恢复。')) {
      const success = saveService.deleteGame(slotId);
      if (success) {
        showNotification('存档删除成功');
        loadSaveSlots();
      } else {
        showNotification('删除失败，请重试');
      }
    }
  };

  const handleExport = (slotId: number) => {
    const success = saveService.exportSave(slotId);
    if (success) {
      showNotification('存档导出成功');
    } else {
      showNotification('导出失败，请重试');
    }
  };

  const handleImport = (slotId: number, file: File) => {
    saveService.importSave(file, slotId).then(success => {
      if (success) {
        showNotification('存档导入成功');
        loadSaveSlots();
      } else {
        showNotification('导入失败，请检查文件格式');
      }
    });
  };

  const handleClearAll = () => {
    if (window.confirm('确定要清空所有存档吗？此操作不可恢复，包括自动存档。\n\n清空后将重新加载页面以重置游戏状态。')) {
      // 禁用自动保存，防止在重载期间重新保存
      onSetAutoSaveEnabled(false);
      
      const success = saveService.clearAllSaves();
      if (success) {
        showNotification('所有存档已清空，正在重新加载...');
        // 延迟重载，让用户看到通知
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        // 如果清空失败，重新启用自动保存
        onSetAutoSaveEnabled(true);
        showNotification('清空失败，请重试');
      }
    }
  };

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  const formatPlayTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}小时${minutes}分钟`;
  };

  const getStorageStats = () => {
    return saveService.getStorageStats();
  };

  const storageStats = getStorageStats();

  return (
    <div className="save-panel">
      <div className="save-panel-header">
        <h2>存档管理</h2>
        <div className="save-tabs">
          <button
            className={`tab-button ${activeTab === 'save' ? 'active' : ''}`}
            onClick={() => setActiveTab('save')}
          >
            保存游戏
          </button>
          <button
            className={`tab-button ${activeTab === 'load' ? 'active' : ''}`}
            onClick={() => setActiveTab('load')}
          >
            加载游戏
          </button>
        </div>
      </div>

      {notification && (
        <div className="notification">
          {notification}
        </div>
      )}

      <div className="storage-stats">
        <span>存档数量: {storageStats.saves}/3</span>
        <span>存储使用: {(storageStats.used / 1024).toFixed(1)}KB</span>
        <button 
          className="clear-all-button"
          onClick={handleClearAll}
          title="清空所有存档"
        >
          清空存档
        </button>
      </div>

      <div className="save-content">
        {activeTab === 'save' && (
          <div className="save-tab">
            <div className="save-input">
              <input
                type="text"
                placeholder="输入存档名称..."
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                maxLength={20}
              />
            </div>
            <div className="save-slots">
              {saveSlots.map((slot) => (
                <div
                  key={slot.id}
                  className={`save-slot ${selectedSlot === slot.id ? 'selected' : ''}`}
                  onClick={() => setSelectedSlot(slot.id)}
                >
                  <div className="slot-header">
                    <span className="slot-id">槽位 {slot.id}</span>
                    <button
                      className="save-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSave(slot.id);
                      }}
                    >
                      保存
                    </button>
                  </div>
                  
                  {!slot.isEmpty && slot.saveGame && (
                    <div className="save-info">
                      <div className="save-name">{slot.saveGame.name}</div>
                      <div className="save-details">
                        <span>时间: {formatDate(slot.saveGame.timestamp)}</span>
                        <span>人口: {slot.saveGame.metadata.population}</span>
                        <span>避难所等级: {slot.saveGame.metadata.shelterLevel}</span>
                        <span>游戏时长: {formatPlayTime(slot.saveGame.metadata.playTime)}</span>
                      </div>
                    </div>
                  )}
                  
                  {slot.isEmpty && (
                    <div className="empty-slot">
                      <span>空槽位</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'load' && (
          <div className="load-tab">
            <div className="save-slots">
              {saveSlots
                .filter(slot => !slot.isEmpty)
                .map((slot) => (
                  <div key={slot.id} className="save-slot">
                    <div className="slot-header">
                      <span className="slot-id">槽位 {slot.id}</span>
                      <div className="slot-actions">
                        <button
                          className="load-button"
                          onClick={() => handleLoad(slot.id)}
                        >
                          加载
                        </button>
                        <button
                          className="export-button"
                          onClick={() => handleExport(slot.id)}
                        >
                          导出
                        </button>
                        <button
                          className="delete-button"
                          onClick={() => handleDelete(slot.id)}
                        >
                          删除
                        </button>
                      </div>
                    </div>
                    
                    {slot.saveGame && (
                      <div className="save-info">
                        <div className="save-name">{slot.saveGame.name}</div>
                        <div className="save-details">
                          <span>时间: {formatDate(slot.saveGame.timestamp)}</span>
                          <span>人口: {slot.saveGame.metadata.population}</span>
                          <span>避难所等级: {slot.saveGame.metadata.shelterLevel}</span>
                          <span>游戏时长: {formatPlayTime(slot.saveGame.metadata.playTime)}</span>
                          <span>总资源: {slot.saveGame.metadata.totalResources}</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="import-section">
                      <label className="import-label">
                        导入存档:
                        <input
                          type="file"
                          accept=".json"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImport(slot.id, file);
                              e.target.value = '';
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                ))}
                
              {saveSlots.filter(slot => !slot.isEmpty).length === 0 && (
                <div className="no-saves">
                  <p>暂无存档</p>
                  <p>请先保存游戏</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SavePanel;