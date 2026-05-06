
import { Unit } from "./Unit.js";
import { UnitType } from "../data/Enums.js";








export class Tank extends Unit {
    constructor(player, x, y, stats) {
        const defaultStats = {
            label: 'T',
            name: 'Tank',
            move: 1,
            force: 3,
            health: 5,
            directions: [
                [-1, 0], [1, 0], [0, -1], [0, 1]
            ]
        };
        super(UnitType.TANK, stats || defaultStats, player, x, y);
    }

    render(ctx, cellSize) {
        ctx.fillStyle = this.player === 1 ? 'blue' : 'red';
        ctx.fillRect(this.x * cellSize + 5, this.y * cellSize + 5, cellSize - 10, cellSize - 10);
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.label, this.x * cellSize + cellSize / 2, this.y * cellSize + cellSize / 2);
    }
}