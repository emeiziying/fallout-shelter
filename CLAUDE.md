# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **React + TypeScript** fallout shelter management game - a placement/idle game where players build and manage an underground bunker, assign residents to facilities, and produce resources.

## Development Commands

### Primary Commands
```bash
npm start              # Start development server (localhost:3000)
npm run build         # Build for production
npm test              # Run tests
```

### No lint/typecheck commands are configured - use build to check for errors.

## Architecture Overview

### Core Game Loop
The game runs on a **1-second update cycle** managed by `useGameState.ts`. Every second:
1. Resources are produced based on facility efficiency and worker skills
2. Resources are consumed by residents (food: 0.1/sec, water: 0.08/sec per person)
3. Building progress advances based on assigned construction workers
4. Resident status (isWorking) is updated based on room assignments

### Key State Management
- **Single Source of Truth**: `useGameState.ts` contains all game state and logic
- **Immutable Updates**: All state changes use immutable patterns with `setGameState(prevState => ...)`
- **Real-time Calculations**: Production, consumption, and building progress calculated every second

### Component Structure
- **App.tsx**: Main container with tab navigation and notification system
- **ResourcePanel**: Displays current resources, limits, and production rates
- **RoomPanel**: Facility construction, management, and worker assignment
- **ResidentPanel**: Resident recruitment, skill display, and job assignment
- **TechnologyPanel**: Research system (basic implementation)
- **GameStats**: Overview dashboard

### Data Architecture

#### Core Game State (`types/index.ts`)
- **GameState**: Main game state container
- **Resources**: 8 resource types (food, water, power, materials, components, chemicals, money, research)
- **Room**: Facility data with building progress, workers, and production
- **Resident**: Individual with skills, happiness, health, and work assignment

#### Resource System
- **Production**: Calculated by `calculateResourceProduction()` based on facility efficiency
- **Consumption**: Residents consume food/water, facilities consume power
- **Limits**: Storage capacity based on warehouse/storage facilities

#### Worker Assignment Logic
- **Building Workers**: Residents without `assignedRoom` can participate in construction
- **Facility Workers**: Residents with `assignedRoom` work in specific facilities
- **Efficiency**: Based on relevant skills (engineering for building, specific skills for production)

### Important Game Mechanics

#### Building System
- **Construction**: Requires available workers (those without `assignedRoom`)
- **Progress**: Advances based on worker engineering skills and efficiency
- **Auto-assignment**: Idle workers automatically assigned to construction
- **No Workers**: Building shows " ��� " when no workers available

#### Resident Management
- **Skills**: 6 types (engineering, medical, combat, exploration, research, management)
- **Status**: `isWorking` determined by room assignment OR construction participation
- **Recruitment**: Costs scale with existing population

#### Facility Management
- **Grouping**: Same facility types grouped together in UI
- **Upgrading**: Individual facilities can be upgraded with increasing costs
- **Worker Assignment**: Direct assignment via dropdown in facility list

### UI/UX Patterns

#### Notification System
- **Light Notifications**: Right-corner notifications for non-blocking alerts
- **No Alerts**: Avoid `alert()` - use notification state instead

#### Mobile Responsiveness
- **Breakpoints**: 768px and 480px with grid/flex adjustments
- **Unified Card System**: Consistent rgba backgrounds and styling
- **Touch-friendly**: Appropriate touch targets and spacing

#### State Display
- **Building Count**: Only completed facilities count as "�� "
- **Construction Status**: Shows separate count for facilities under construction
- **Worker Status**: Clear indication of worker availability and assignment

### Key Files to Understand

1. **`useGameState.ts`**: Core game logic and state management
2. **`gameLogic.ts`**: Production, consumption, and efficiency calculations
3. **`initialState.ts`**: Starting game configuration
4. **`types/index.ts`**: All TypeScript interfaces and types
5. **`App.tsx`**: Main component structure and tab management

### Development Notes

- **Building Progress**: Uses `isBuilding` flag and `buildProgress`/`buildTime` tracking
- **Worker Logic**: Distinction between facility workers (`assignedRoom`) and construction workers
- **Resource Calculations**: Real-time updates with delta time for smooth progression
- **Error Handling**: Build system validates resources and worker availability before proceeding