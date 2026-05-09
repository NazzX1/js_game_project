import { UnitType, GamePhase } from "./Enums.js";

export const Levels = {
    1: {
        gridSize:     8,
        victoryCells: 33,
        spawnRows:    2,
        unitsPerPlayer: 5,
        maxUnitsPerCell: 3,
        phaseTimers: {
            [GamePhase.PLACEMENT]: 20,
            [GamePhase.MOVEMENT]:  30,
            [GamePhase.ACTION]:    20,
        },
        units: {
            [UnitType.SOLDIER]: { 
                move: 1, 
                force: 2, 
                label: 'S', 
                name: 'Soldat',
                health: 3,
                directions: [
                    [-1, 0], [1, 0], [0, -1], [0, 1],
                    [-1, -1], [-1, 1], [1, -1], [1, 1]
                ],
                asset: './assets/units/soldier.png'  
            },
            [UnitType.RIDER]:   { 
                move: 2,
                force: 1, 
                label: 'C', 
                name: 'Cavalier',
                health: 4,
                directions: [[0, -1]],
                asset: './assets/units/rider.png'
            },
            [UnitType.TANK]:    { 
                move: 1, 
                force: 3, 
                label: 'T', 
                name: 'Tank',
                health: 5,
                directions: [
                    [-1, 0], [1, 0], [0, -1], [0, 1]
                ],
                asset: './assets/units/tank.png' 
            },
        },
        
        bonusAtkCount: 4,
        bonusDefCount: 4,
        trapCount:     4,
    },
};