# 末日避难所

一款基于 React + TypeScript 构建的放置类游戏，玩家需要管理地下避难所，为居民分配工作，在末日世界中生产各种资源。

🎮 **[在线体验](https://emeiziying.github.io/fallout-shelter/)**

## 游戏特色

- 🏠 **设施建造**：建造9种不同类型的功能设施，从农场到研究实验室
- 👥 **居民管理**：招募居民，分配工作，培养技能
- ⚡ **资源生产**：自动化生产系统，实时计算生产效率
- 📊 **数据统计**：监控避难所运营状况和居民数据
- 💾 **存档系统**：自动保存功能，支持手动存档和读档
- 🔬 **科技研究**：基础研究系统，推进避难所发展
- 📱 **响应式设计**：针对桌面端和移动端优化

## 游戏机制

### 资源系统

- **8种资源类型**：食物、水、电力、材料、组件、化学品、金钱、研究点
- **自动生产**：根据设施效率每秒自动产出资源
- **资源消耗**：居民每秒消耗食物(0.1/秒)和水(0.08/秒)
- **储存上限**：基于仓库和储存设施数量

### 设施管理

- **9种设施类型**：农场、净水厂、发电站、工坊、宿舍、医疗室、实验室、军械库、训练室
- **建造系统**：需要空闲工人(未分配房间的居民)参与建造
- **设施升级**：可单独升级设施，成本递增
- **工人分配**：通过下拉菜单直接分配工人

### 居民系统

- **6种技能类型**：工程、医疗、战斗、探索、科研、管理
- **状态追踪**：健康、心情、年龄和工作分配
- **效率影响**：工人技能直接影响生产效率
- **招募成本**：成本随现有人口数量递增

## 快速开始

### 环境要求

- Node.js 16+
- npm 或 pnpm

### 安装运行

```bash
# 克隆仓库
git clone https://github.com/username/fallout-shelter.git
cd fallout-shelter

# 安装依赖
npm install

# 启动开发服务器
npm start
```

游戏将在 `http://localhost:3000` 运行

### 构建生产版本

```bash
npm run build
```

## 项目架构

### 核心组件

- **App.tsx**：主容器，包含标签导航和通知系统
- **ResourcePanel**：实时资源显示和生产速率
- **RoomPanel**：设施建造和工人管理
- **ResidentPanel**：居民招募和工作分配
- **TechnologyPanel**：科技研究界面
- **GameStats**：综合避难所概览

### 状态管理

- **useGameState.ts**：核心游戏逻辑，1秒更新周期
- **gameLogic.ts**：生产、消耗和效率计算
- **saveService.ts**：本地存储的存档功能

### 目录结构

```
src/
├── components/          # React 组件
├── hooks/              # 自定义 Hooks (useGameState)
├── types/              # TypeScript 类型定义
├── utils/              # 游戏逻辑工具
├── data/               # 初始游戏状态
└── services/           # 存档服务
```

## 游戏流程

1. **资源生产**：每秒根据工人效率生产资源
2. **资源消耗**：居民自动消耗食物和水
3. **建造设施**：分配空闲居民建造新设施
4. **工人分配**：将居民分配到设施以优化生产
5. **科技研究**：使用研究点解锁新技术
6. **扩展发展**：建造更多设施，招募更多居民

## 开发指南

### 可用脚本

- `npm start` - 启动开发服务器
- `npm run build` - 构建生产版本
- `npm test` - 运行测试

### 核心文件

- `src/hooks/useGameState.ts` - 主要游戏状态和逻辑
- `src/utils/gameLogic.ts` - 生产和效率计算
- `src/types/index.ts` - TypeScript 类型定义
- `src/data/initialState.ts` - 初始游戏配置

### 代码规范

- TypeScript 类型安全
- 不可变状态更新
- 组件级 CSS 模块
- 移动端优先的响应式设计

## 技术栈

- **前端框架**：React 18, TypeScript
- **样式方案**：CSS-in-JS，响应式设计
- **状态管理**：React Hooks (useState, useEffect)
- **构建工具**：Create React App
- **测试框架**：Jest, React Testing Library

## 未来规划

- [ ] 扩展科技树系统
- [ ] 地面探索任务
- [ ] 威胁和防御系统
- [ ] 离线进度计算
- [ ] 成就系统
- [ ] 居民关系和事件
- [ ] 更多设施类型
- [ ] 多人游戏功能

## 参与贡献

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 致谢

- 灵感来源于 Bethesda 的《辐射：避难所》
- 使用 React 和 TypeScript 构建
- UI 设计灵感来自末日废土美学

## 维护说明

> **注意**：本项目包含中英文双版本 README：
> - `README.md` - 英文版本
> - `README-zh.md` - 中文版本
> 
> 更新项目信息时，请同时更新两个版本以保持同步。