export class AIPlayer {
    constructor(gameManager) {
        this.gm = gameManager;
        this.isThinking = false;
    }

    placeUnits() {
        const unitTypes = [...this.gm.placementOrder];
        let attempts = 0;

        while (this.gm.unitsLeft[2] > 0) {
            const availableTypes = unitTypes.filter(type =>
                this.gm.canPlaceUnitType(type, 2)
            );

            if (availableTypes.length === 0) break;

            const randomType = availableTypes[
                Math.floor(Math.random() * availableTypes.length)
            ];

            const randomX = Math.floor(Math.random() * this.gm.grid.size);
            const spawnRows = this.gm.level.spawnRows;
            const randomY = Math.floor(Math.random() * spawnRows);

            this.gm.placingPlayer = 2;
            this.gm.currentPlayer = 2;
            this.gm.selectedPlacementUnit = randomType;
            const placed = this.gm.placeUnit({x: randomX, y: randomY});

            attempts = placed ? 0 : attempts + 1;
            if (attempts > this.gm.grid.size * this.gm.grid.size) break;
        }
    }
}
