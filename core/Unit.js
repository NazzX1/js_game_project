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
                    const nx = x + dx;
                    const ny = y + dy;
                    const key = `${nx},${ny}`;

                    if (!visited.has(key) && grid.isInBounds(nx, ny)) {
                        visited.add(key);
                        const cell = grid.matrix[ny][nx];
                        const canEnter = !cell.units || cell.units.length === 0 ||
                            (cell.units.length === 1 && cell.units[0].player === this.player);

                        if (canEnter) {
                            moves.push({ x: nx, y: ny });
                            queue.push({ x: nx, y: ny, dist: dist + 1 });
                        }
                    }
                }
            }
        }

        return moves;
    }
}