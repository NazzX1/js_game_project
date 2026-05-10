import { UnitType } from '../data/Enums.js';

export class AIPlayer {
    constructor(gameManager) {
        this.gm = gameManager;
        this.player = 2;
        this.enemy = 1;
        this.isThinking = false;
    }

    placeUnits() {
        const unitsToPlace = [
            UnitType.TANK,
            UnitType.SOLDIER,
            UnitType.RIDER,
            UnitType.SOLDIER,
            UnitType.TANK
        ];

        for (const type of unitsToPlace) {
            if (this.gm.unitsLeft[this.player] === 0) break;

            const cell = this.#bestSpawnCell(type);
            if (!cell) continue;

            this.gm.currentPlayer = this.player;
            this.gm.placingPlayer = this.player;
            this.gm.selectedPlacementUnit = type;
            this.gm.placeUnit(cell);
        }
    }

    playTurn() {
        if (this.isThinking || this.gm.currentPlayer !== this.player) return false;

        this.isThinking = true;

        const units = this.#myUnits();

        // Phase 1: Attack with stationary units first if they have targets in range
        for (const unit of units) {
            if (this.gm.shouldAutoEndTurn()) break;
            this.#attack(unit);
        }

        // Phase 2: Move units and potentially attack after moving
        for (const unit of units) {
            if (this.gm.shouldAutoEndTurn()) break;
            if (!unit.alive || unit.hasMoved || unit.hasActed) continue;

            const move = this.#bestMove(unit);
            if (move && (move.x !== unit.x || move.y !== unit.y)) {
                if (this.#move(unit, move.x, move.y)) {
                    if (!this.gm.shouldAutoEndTurn()) {
                        this.#attack(unit);
                    }
                }
            }
        }

        this.gm.selectedUnit = null;
        this.gm.validMoves = [];
        this.gm.validAttacks = [];
        this.isThinking = false;

        return true;
    }

    #bestSpawnCell(type) {
        let bestCell = null;
        let bestScore = -Infinity;

        for (let y = 0; y < this.gm.level.spawnRows; y++) {
            for (let x = 0; x < this.gm.grid.size; x++) {
                const cell = this.gm.grid.matrix[y][x];
                const unit = this.gm.createUnit(type, this.player, x, y);

                if (!this.gm.canStackUnit(cell, unit)) continue;

                const center = Math.abs(x - (this.gm.grid.size - 1) / 2);
                const score = y * 3 - center;

                if (score > bestScore) {
                    bestScore = score;
                    bestCell = { x, y };
                }
            }
        }

        return bestCell;
    }

    #attack(unit) {
        if (!unit.alive || unit.hasActed) return false;

        const target = this.#bestTarget(unit, unit.x, unit.y);
        if (!target) return false;

        return this.gm.performAttack(unit, target);
    }

    #bestMove(unit) {
        let bestMove = null;
        let bestScore = -Infinity;

        for (const move of this.gm.getValidMoves(unit)) {
            const score = this.#moveScore(unit, move);

            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        return bestMove;
    }

    #moveScore(unit, move) {
        const distance = this.#distanceToEnemy(move.x, move.y, unit);
        const canAttack = this.#bestTarget(unit, move.x, move.y) !== null;
        const isDangerous = this.#enemyCanKill(unit, move.x, move.y);

        let score = 0;
        score += canAttack ? 20 : 0;
        score -= distance * 5;
        score += move.y * 2;
        score -= isDangerous ? 30 : 0;

        return score;
    }

    #bestTarget(unit, x, y) {
        const targets = x === unit.x && y === unit.y
            ? this.#targetsFromCurrentCell(unit)
            : this.#targetsFromMove(unit, x, y);

        if (targets.length === 0) return null;

        targets.sort((a, b) => {
            const aKill = unit.force >= a.health;
            const bKill = unit.force >= b.health;

            if (aKill !== bKill) return bKill - aKill;
            return a.health - b.health;
        });

        return targets[0];
    }

    #targetsFromCurrentCell(unit) {
        return this.gm.getValidAttacks(unit)
            .map(({ x, y }) => this.gm.grid.matrix[y][x].units[0])
            .filter(target => target && target.player === this.enemy && target.alive);
    }

    #targetsFromMove(unit, x, y) {
        const oldX = unit.x;
        const oldY = unit.y;

        unit.x = x;
        unit.y = y;
        const targets = this.#targetsFromCurrentCell(unit);
        unit.x = oldX;
        unit.y = oldY;

        return targets;
    }

    #distanceToEnemy(startX, startY, unit) {
        const queue = [{ x: startX, y: startY, distance: 0 }];
        const visited = new Set([`${startX},${startY}`]);

        while (queue.length > 0) {
            const current = queue.shift();

            for (const [dx, dy] of this.#directions()) {
                const x = current.x + dx;
                const y = current.y + dy;
                const key = `${x},${y}`;

                if (!this.gm.grid.isInBounds(x, y) || visited.has(key)) continue;
                if (this.#hasEnemy(x, y)) return current.distance + 1;
                if (!this.#canWalkThrough(x, y, unit)) continue;

                visited.add(key);
                queue.push({ x, y, distance: current.distance + 1 });
            }
        }

        return this.gm.grid.size * 2;
    }

    #move(unit, x, y) {
        return this.gm.moveUnit(unit, x, y);
    }

    #enemyCanKill(unit, x, y) {
        return this.#enemyUnits().some(enemy => {
            const distance = Math.abs(enemy.x - x) + Math.abs(enemy.y - y);
            const sameLine = enemy.x === x || enemy.y === y;
            const minRange = enemy.minAttackRange ?? 1;
            const maxRange = enemy.maxAttackRange ?? 1;

            return sameLine &&
                distance >= minRange &&
                distance <= maxRange &&
                enemy.force >= unit.health;
        });
    }

    #canWalkThrough(x, y, movingUnit) {
        const cell = this.gm.grid.matrix[y][x];
        if (cell.units.length === 0) return true;

        return cell.units.every(unit =>
            unit.player === movingUnit.player &&
            unit.type === movingUnit.type
        ) && cell.units.length < this.gm.level.maxUnitsPerCell;
    }

    #hasEnemy(x, y) {
        return this.gm.grid.matrix[y][x].units.some(unit =>
            unit.player === this.enemy &&
            unit.alive
        );
    }

    #myUnits() {
        return this.gm.units[this.player].filter(unit => unit.alive);
    }

    #enemyUnits() {
        return this.gm.units[this.enemy].filter(unit => unit.alive);
    }

    #directions() {
        return [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1]
        ];
    }
}
