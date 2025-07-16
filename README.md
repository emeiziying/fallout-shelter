# Fallout Shelter

A React + TypeScript idle/placement game where players manage an underground bunker, assign residents to facilities, and produce resources in a post-apocalyptic world.

🎮 **[Live Demo](https://emeiziying.github.io/fallout-shelter/)**

## Features

- 🏠 **Facility Construction**: Build 9 different facility types from farms to research labs
- 👥 **Resident Management**: Recruit residents, assign jobs, and develop their skills
- ⚡ **Resource Production**: Automated production system with real-time calculations
- 📊 **Game Statistics**: Monitor shelter operations and resident data
- 💾 **Save System**: Auto-save with manual save/load functionality
- 🔬 **Technology Research**: Basic research system for advancing your shelter
- 📱 **Mobile Responsive**: Optimized for both desktop and mobile devices

## Game Mechanics

### Resource System
- **8 Resource Types**: Food, Water, Power, Materials, Components, Chemicals, Money, Research
- **Production**: Resources are automatically produced every second based on facility efficiency
- **Consumption**: Residents consume food (0.1/sec) and water (0.08/sec) per person
- **Storage Limits**: Based on warehouse and storage facility counts

### Facility Management
- **9 Facility Types**: Farm, Water Treatment, Power Plant, Workshop, Quarters, Medical Bay, Laboratory, Armory, Training Room
- **Construction**: Requires available workers (residents without room assignments)
- **Upgrading**: Individual facilities can be upgraded with increasing costs
- **Worker Assignment**: Direct assignment via dropdown interface

### Resident System
- **6 Skill Types**: Engineering, Medical, Combat, Exploration, Research, Management
- **Status Tracking**: Health, happiness, age, and work assignments
- **Efficiency**: Worker skills directly impact production rates
- **Recruitment**: Costs scale with existing population

## Quick Start

### Prerequisites
- Node.js 16+ 
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/username/fallout-shelter.git
cd fallout-shelter

# Install dependencies
npm install

# Start development server
npm start
```

The game will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

## Project Architecture

### Core Components
- **App.tsx**: Main container with tab navigation and notification system
- **ResourcePanel**: Real-time resource display and production rates
- **RoomPanel**: Facility construction and worker management
- **ResidentPanel**: Resident recruitment and job assignment
- **TechnologyPanel**: Research system interface
- **GameStats**: Comprehensive shelter overview

### State Management
- **useGameState.ts**: Core game logic with 1-second update cycle
- **gameLogic.ts**: Production, consumption, and efficiency calculations
- **saveService.ts**: Local storage save/load functionality

### Data Structure
```
src/
├── components/          # React components
├── hooks/              # Custom hooks (useGameState)
├── types/              # TypeScript interfaces
├── utils/              # Game logic utilities
├── data/               # Initial game state
└── services/           # Save/load services
```

## Game Flow

1. **Resource Production**: Every second, facilities produce resources based on worker efficiency
2. **Resource Consumption**: Residents automatically consume food and water
3. **Construction**: Assign idle residents to build new facilities
4. **Worker Assignment**: Assign residents to facilities for optimal production
5. **Research**: Use research points to unlock new technologies
6. **Expansion**: Build more facilities and recruit more residents

## Development

### Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production  
- `npm test` - Run test suite

### Key Files

- `src/hooks/useGameState.ts` - Main game state and logic
- `src/utils/gameLogic.ts` - Production and efficiency calculations
- `src/types/index.ts` - TypeScript type definitions
- `src/data/initialState.ts` - Starting game configuration

### Code Style
- TypeScript for type safety
- Immutable state updates
- Component-level CSS modules
- Mobile-first responsive design

## Technology Stack

- **Frontend**: React 18, TypeScript
- **Styling**: CSS-in-JS, Responsive design
- **State Management**: React Hooks (useState, useEffect)
- **Build Tool**: Create React App
- **Testing**: Jest, React Testing Library

## Future Roadmap

- [ ] Extended technology tree
- [ ] Surface exploration missions
- [ ] Threat and defense systems
- [ ] Offline progress calculation
- [ ] Achievement system
- [ ] Resident relationships and events
- [ ] Additional facility types
- [ ] Multiplayer features

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by Bethesda's Fallout Shelter
- Built with React and TypeScript
- UI design inspired by post-apocalyptic aesthetics

## Maintenance Note

> **Note**: This project includes bilingual README files:
> - `README.md` - English version
> - `README-zh.md` - Chinese version
> 
> When updating project information, please update both versions to keep them synchronized.