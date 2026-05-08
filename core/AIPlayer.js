import { UnitType } from '../data/Enums.js';

export class AIPlayer {
    constructor(gameManager) {
        this.gm = gameManager;
        this.isThinking = false;
    }

    placeUnits() {
        const unitTypes = [
            UnitType.SOLDIER,
            UnitType.RIDER,
            UnitType.TANK
        ];

        while (this.gm.unitsLeft[2] > 0) {
            const randomType = unitTypes[
                Math.floor(Math.random() * unitTypes.length)
            ];

            const randomX = Math.floor(Math.random() * this.gm.grid.size);
            const spawnRows = this.gm.level.spawnRows;
            const randomY = Math.floor(Math.random() * spawnRows);

            this.gm.placingPlayer = 2;
            this.gm.currentPlayer = 2;
            this.gm.selectedPlacementUnit = randomType;
            const placed = this.gm.placeUnit({x: randomX, y: randomY});

            if (!placed) continue;
        }
    }
}