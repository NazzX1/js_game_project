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

    
    generateSpecials() {
        const items = [CellType.BONUS_ATK, CellType.BONUS_DEF, CellType.TRAP];
        
        items.sort(() => Math.random() - 0.5);

        const startRow = 2;
        const endRow = this.size - 3; 
        const rowRange = endRow - startRow + 1; 

        const sectionWidth = Math.floor(this.size / 3);

        items.forEach((type, i) => {
            const minCol = i * sectionWidth;
            const maxCol = (i + 1) * sectionWidth - 1;

            const r = Math.floor(Math.random() * rowRange) + startRow;
            
            const c = Math.floor(Math.random() * (maxCol - minCol + 1)) + minCol;

            this.getCell(c, r).type = type;
        });
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
                const owner = this.getCell(c, r).owner;
                if (owner === 1) p1++;
                else if (owner === 2) p2++;
            }
        return { p1, p2 };
    }
}