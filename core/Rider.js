import { Unit } from "./Unit.js";
import { UnitType } from "../data/Enums.js";

export class Rider extends Unit {
    constructor(player, x, y, stats) {
        const defaultStats = {
            label: 'R',
            name: 'Rider',
            move: 3,
            force: 1,
            defense: 0,
            health: 4,
            directions: [[0, -1]]
        };
        super(UnitType.RIDER, stats || defaultStats, player, x, y);
    }

    render(ctx, cellSize) {
        ctx.fillStyle = this.player === 1 ? 'blue' : 'red';
        ctx.beginPath();
        ctx.arc(this.x * cellSize + cellSize / 2, this.y * cellSize + cellSize / 2, cellSize / 2 - 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.label, this.x * cellSize + cellSize / 2, this.y * cellSize + cellSize / 2);
    }
}