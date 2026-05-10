import { UnitType, GamePhase } from "./Enums.js";

export const Levels = {
    1: {
        gridSize:     8,
        victoryCells: 33,
        spawnRows:    2,
        unitsPerPlayer: 5,
        maxUnitsPerCell: 3,
        maxActionsPerTurn: 2,
        initialUnits: {
            [UnitType.SOLDIER]: 3,
            [UnitType.RIDER]:   1,
            [UnitType.TANK]:    1,
        },
        phaseTimers: {
            [GamePhase.PLACEMENT]: 20,
            [GamePhase.MOVEMENT]:  30,
        },
        units: {
            [UnitType.SOLDIER]: { 
                move: 1, 
                force: 40, 
                defense: 20,
                label: 'S', 
                name: 'Soldat',
                health: 100,
                directions: [
                    [-1, 0], [1, 0], [0, -1], [0, 1],
                ],
                minAttackRange: 1,
                maxAttackRange: 1,
                asset: './assets/units/soldier.png'  
            },
            [UnitType.RIDER]:   { 
                move: 2,
                force: 20, 
                defense: 30,
                label: 'C', 
                name: 'Cavalier',
                health: 100,
                directions: [[0, -1]],
                minAttackRange: 1,
                maxAttackRange: 2,
                asset: './assets/units/rider.png'
            },
            [UnitType.TANK]:    { 
                move: 1, 
                force: 70, 
                defense: 60,
                label: 'T', 
                name: 'Tank',
                health: 100,
                directions: [
                    [-1, 0], [1, 0], [0, -1], [0, 1]
                ],
                minAttackRange: 2,
                maxAttackRange: 4,
                asset: './assets/units/tank.png' 
            },
        },
        
        bonusAtkCount: 4,
        bonusDefCount: 4,
        trapCount:     4,
    },
};