
import { Unit } from "./Unit.js";
import { UnitType } from "../data/Enums.js";








export class Tank extends Unit {
    constructor(player, x, y) {
        const stats = {
            label: 'T',
            name: 'Tank',
            move: 1,
            force: 3
        };
        super(UnitType.TANK, stats, player, x, y);
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
        const dx = Math.sign(targetX - this.x);
        const dy = Math.sign(targetY - this.y);
        if (!this.isDirectionAllowed(dx, dy)) return false;

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