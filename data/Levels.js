import { UnitType } from "./Enums.js";

export const Levels = {
    1: {
        gridSize:     8,
        victoryCells: 33,
        spawnRows:    2,
        unitsPerPlayer: 5,
        units: {
            [UnitType.SOLDIER]: { 
                move: 1, 
                force: 2, 
                label: 'S', 
                name: 'Soldat',
                asset: './assets/units/soldier.png'  
            },
            [UnitType.RIDER]:   { 
                move: 2,
                force: 1, 
                label: 'C', 
                name: 'Cavalier',
                asset: './assets/units/rider.png'
            },
            [UnitType.TANK]:    { 
                move: 1, 
                force: 3, 
                label: 'T', 
                name: 'Tank',
                asset: './assets/units/tank.png' 
            },
        },
        
        bonusAtkCount: 4,
        bonusDefCount: 4,
        trapCount:     4,
    },
};