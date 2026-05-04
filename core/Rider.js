import { Unit } from "./Unit.js";
import { UnitType } from "../data/Enums.js";

export class Rider extends Unit {
    constructor(player, x, y) {
        const stats = {
            label: 'R',
            name: 'Rider',
            move: 3,
            force: 1
        };
        super(UnitType.RIDER, stats, player, x, y);
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

    attack(target) {
        if (this.hasActed) return false;
        if (!target || !target.alive || target.player === this.player) return false;

        const distance = Math.abs(this.x - target.x) + Math.abs(this.y - target.y);
        if (distance > 1) return false;

        target.force -= this.force;
        if (target.force <= 0) {
            target.alive = false;
            target.force = 0;
        }

        this.hasActed = true;
        return true;
    }

    move(targetX, targetY, grid) {
        if (this.hasMoved) return false;
        const distance = Math.abs(this.x - targetX) + Math.abs(this.y - targetY);
        if (distance > this.moveRange) return false;

        const targetCell = grid.matrix[targetY][targetX];
        if (targetCell.owner !== 0 && targetCell.owner !== this.player) return false;

        grid.matrix[this.y][this.x].units = grid.matrix[this.y][this.x].units.filter(u => u !== this);
        this.x = targetX;
        this.y = targetY;
        targetCell.units.push(this);
        targetCell.owner = this.player;

        this.hasMoved = true;
        return true;
    }

}