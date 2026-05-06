export class Unit {
    constructor(type, stats, player, x, y) {
        this.type      = type;
        this.label     = stats.label;
        this.name      = stats.name;
        this.moveRange = stats.move;
        this.force     = stats.force;
        this.maxHealth = stats.health ?? 1;
        this.health    = this.maxHealth;
        this.allowedDirections = stats.directions || [
            [-1, 0], [1, 0], [0, -1], [0, 1]
        ];
        this.player    = player;
        this.x         = x;
        this.y         = y;

        this.hasMoved    = false;
        this.hasActed    = false;
        this.isDefending = false;
        this.trapDebuff  = false;
        this.alive       = true;
    }








    resetTurn() {
        this.hasMoved    = false;
        this.hasActed    = false;
        this.isDefending = false;
    }

    isDirectionAllowed(dx, dy) {
        return this.allowedDirections.some(([ax, ay]) => ax === dx && ay === dy);
    }

    takeDamage(amount) {
        if (!this.alive || amount <= 0) return;
        this.health = Math.max(0, this.health - amount);
        if (this.health === 0) {
            this.alive = false;
        }
    }

    attack(target) {
        if (this.hasActed) return false;
        if (!target || !target.alive || target.player === this.player) return false;

        const distance = Math.abs(this.x - target.x) + Math.abs(this.y - target.y);
        if (distance > 1) return false;

        target.takeDamage(this.force);
        this.hasActed = true;
        return true;
    }

    move(targetX, targetY, grid) {
        if (this.hasMoved) return false;
        if (!grid || !grid.isInBounds(targetX, targetY)) return false;

        const dx = Math.sign(targetX - this.x);
        const dy = Math.sign(targetY - this.y);
        if (!this.isDirectionAllowed(dx, dy)) return false;

        const distance = Math.abs(this.x - targetX) + Math.abs(this.y - targetY);
        if (distance > this.moveRange) return false;

        const source = grid.matrix[this.y][this.x];
        const targetCell = grid.matrix[targetY][targetX];
        const canEnter = targetCell.units.length === 0 ||
            (targetCell.units.length === 1 && targetCell.units[0].player === this.player);
        if (!canEnter || targetCell.units.length >= 2) return false;

        source.units = source.units.filter(u => u !== this);
        source.owner = source.units.length ? source.units[0].player : null;

        targetCell.units.push(this);
        targetCell.owner = this.player;
        this.x = targetX;
        this.y = targetY;
        this.hasMoved = true;
        return true;
    }

    getValidMoves(grid) {
        if (!grid) return [];

        const moves = [];
        const visited = new Set();
        const queue = [{ x: this.x, y: this.y, dist: 0 }];
        visited.add(`${this.x},${this.y}`);

        while (queue.length > 0) {
            const { x, y, dist } = queue.shift();

            if (dist < this.moveRange) {
                for (const [dx, dy] of this.allowedDirections) {
                    const newX = x + dx;
                    const newY = y + dy;
                    const key = `${newX},${newY}`;

                    if (!visited.has(key) && grid.isInBounds(newX, newY)) {
                        visited.add(key);
                        const cell = grid.matrix[newY][newX];
                        const canEnter = !cell.units || cell.units.length === 0 ||
                            (cell.units.length === 1 && cell.units[0].player === this.player);

                        if (canEnter) {
                            moves.push({ x: newX, y: newY });
                            queue.push({ x: newX, y: newY, dist: dist + 1 });
                        }
                    }
                }
            }
        }

        return moves;
    }
}