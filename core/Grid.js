import { CellType } from "../data/Enums.js";

export class Grid {
    constructor(size) {
        this.size   = size;
        this.matrix = this.#createEmpty(size);
    }

    #createEmpty(size) {
        const grid = [];
        for (let row = 0; row < size; row++) {
            const currentRow = [];
            for (let col = 0; col < size; col++) {
                currentRow.push({
                    owner: null,
                    units: [],
                    type: CellType.NEUTRAL,
                    row,
                    col
                });
            }
            grid.push(currentRow);
        }
        return grid;
    }

    
    generateSpecials(bonusAtk, bonusDef, traps) {
        const mid = [];
        for (let r = 2; r <= 5; r++)
            for (let c = 0; c < this.size; c++)
                mid.push({ r, c });

        // Fisher-Yates shuffle
        for (let i = mid.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [mid[i], mid[j]] = [mid[j], mid[i]];
        }

        const placed = [];
        const specials = [
            ...Array(bonusAtk).fill(CellType.BONUS_ATK),
            ...Array(bonusDef).fill(CellType.BONUS_DEF),
            ...Array(traps).fill(CellType.TRAP),
        ];

        for (const tile of mid) {
            if (specials.length === 0) break;
            if (!this._hasAdjacentSpecial(tile, placed)) {
                this.matrix[tile.r][tile.c].type = specials.shift();
                placed.push(tile);
            }
        }
    }

    _hasAdjacentSpecial(tile, placed) {
        return placed.some(p =>
            Math.abs(p.r - tile.r) <= 1 && Math.abs(p.c - tile.c) <= 1
        );
    }

    isInBounds(x, y) {
        return x >= 0 && x < this.size && y >= 0 && y < this.size;
    }

    getCell(x, y) {
        return this.matrix[y][x];
    }

    countTerritory() {
        let p1 = 0, p2 = 0;
        for (let r = 0; r < this.size; r++)
            for (let c = 0; c < this.size; c++) {
                const owner = this.matrix[r][c].owner;
                if (owner === 1) p1++;
                else if (owner === 2) p2++;
            }
        return { p1, p2 };
    }
}