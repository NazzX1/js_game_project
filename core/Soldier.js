import { Unit } from "./Unit.js";
import { UnitType } from "../data/Enums.js";



export class Soldier extends Unit {
    constructor(player, x, y, stats) {
        const defaultStats = {
            label: 'S',
            name: 'Soldier',
            move: 2,
            force: 1,
            health: 3,
            directions: [
                [-1, 0], [1, 0], [0, -1], [0, 1],
                [-1, -1], [-1, 1], [1, -1], [1, 1]
            ]
        };
        super(UnitType.SOLDIER, stats || defaultStats, player, x, y);
    }

    render(ctx, cellSize) {
        ctx.fillStyle = this.player === 1 ? 'blue' : 'red';
        ctx.fillRect(this.x * cellSize + 10, this.y * cellSize + 10, cellSize - 20, cellSize - 20);
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.label, this.x * cellSize + cellSize / 2, this.y * cellSize + cellSize / 2);
    }
}