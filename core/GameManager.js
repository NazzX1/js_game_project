import { CellType, GamePhase, UnitType } from '../data/Enums.js';
import { Levels } from '../data/Levels.js';
import { Grid } from './Grid.js';
import { Unit } from './Unit.js';
import { AIPlayer } from './AIPlayer.js';
import { Soldier } from './Soldier.js';
import { Rider } from './Rider.js';
import { Tank } from './Tank.js';

export class GameManager {
    constructor(level) {
        this.level = Levels[level];
        this.config = this.level;
        this.grid = new Grid(this.level.gridSize);
        this.grid.generateSpecials(this.level);
        this.initialUnits = this.level.initialUnits || {
            [UnitType.SOLDIER]: 3,
            [UnitType.RIDER]: 1,
            [UnitType.TANK]: 1,
        };
        this.unitsPerPlayer = Object.values(this.initialUnits)
            .reduce((total, count) => total + count, 0);
        this.maxActionsPerTurn = this.level.maxActionsPerTurn ?? Infinity;

        this.units = { 1: [], 2: [] }; 
        this.players = { 1: { name: 'P1' }, 2: { name: 'P2' } };

        this.currentPlayer = 1;
        this.placingPlayer = 1;
        this.turnCount = 1;
        this.unitsLeft = {
            1: this.unitsPerPlayer,
            2: this.unitsPerPlayer,
        };
        this.unitTypesLeft = this.#createUnitTypesLeft();
        this.actionsThisTurn = 0;
        
        this.selectedUnit = null;
        this.validMoves = [];
        this.validAttacks = [];
        this.selectedPlacementUnit = null;
        this.ai = new AIPlayer(this);

        this.phaseTimers = this.level.phaseTimers || {
            [GamePhase.PLACEMENT]: 30,
            [GamePhase.MOVEMENT]: this.level.time_per_turn || 60,
            [GamePhase.ACTION]: 20,
            [GamePhase.FINISHED]: 0,
        };

        this.placementOrder = this.#createPlacementOrder();
        this.placementIndex = { 1: 0, 2: 0 };

        this.diceRolls = {
            1: null,
            2: null
        };

        this.dicePlayerTurn = 1;

        this.setPhase(GamePhase.PLACEMENT);
    }

    #createPlacementOrder() {
        return Object.entries(this.initialUnits)
            .flatMap(([type, count]) => Array(count).fill(type));
    }

    #createUnitTypesLeft() {
        return {
            1: { ...this.initialUnits },
            2: { ...this.initialUnits },
        };
    }

    setFirstPlayer(player) {
        this.currentPlayer = player;
        this.placingPlayer = player;
    }

    getPhaseTime(phase) {
        return this.phaseTimers[phase] ?? 0;
    }

    setPhase(phase) {
        this.phase = phase;
        this.phaseTimeLeft = this.getPhaseTime(phase);
        this.phaseTimedOut = false;
    }

    updatePhaseTimer(deltaMs) {
        if (this.phase === GamePhase.FINISHED) return;
        this.phaseTimeLeft -= deltaMs / 1000;
        if (this.phaseTimeLeft <= 0) {
            this.phaseTimeLeft = 0;
            this.phaseTimedOut = true;
        }
    }

    nextPlayerTurn() {
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.selectedUnit = null;
        this.validMoves = [];
        this.validAttacks = [];
        this.actionsThisTurn = 0;
        this.phaseTimedOut = false;
        this.phaseTimeLeft = this.getPhaseTime(this.phase);
    }

    createUnit(type, player, x, y) {
        const stats = this.level.units[type] || {};
        switch (type) {
            case UnitType.SOLDIER:
                return new Soldier(player, x, y, stats);
            case UnitType.RIDER:
                return new Rider(player, x, y, stats);
            case UnitType.TANK:
                return new Tank(player, x, y, stats);
            default:
                return new Unit(type, stats, player, x, y);
        }
    }

    removeUnit(unit) {
        //if (this.phase !== GamePhase.PLACEMENT) return false;
        if (!unit || unit.player !== this.currentPlayer) return false;

        const cell = this.grid.matrix[unit.y][unit.x];
        cell.units = cell.units.filter(u => u !== unit);
        cell.owner = cell.units.length ? cell.units[0].player : null;

        this.units[unit.player] = this.units[unit.player].filter(u => u !== unit);

        if (this.selectedPlacementUnit === unit) {
            this.selectedPlacementUnit = null;
        }

        this.unitsLeft[this.currentPlayer] += 1;
        this.unitTypesLeft[this.currentPlayer][unit.type] += 1;

        return true;
    }

    isInSpawnZone(player, y) {
        const spawnRows = this.level.spawnRows;
        return player === 1
            ? y >= this.grid.size - spawnRows
            : y < spawnRows;
    }

    placeUnit(coords) {
        /* Places selected unit from the panel in the desired cell of the spawn zone during placement phase.*/
        if (!this.unitsLeft[this.currentPlayer]) return false;
        if (!this.canPlaceUnitType(this.selectedPlacementUnit, this.currentPlayer)) return false;
        if (!this.isInSpawnZone(this.currentPlayer, coords.y)) return false;
        const cell = this.grid.matrix[coords.y][coords.x];
        const unit = this.createUnit(this.selectedPlacementUnit, this.currentPlayer, coords.x, coords.y);
        if (!this.canStackUnit(cell, unit)) return false;
        cell.units.push(unit);
        this.units[this.currentPlayer].push(unit);
        cell.owner = this.currentPlayer;
        this.selectedPlacementUnit = null;
        this.unitsLeft[this.currentPlayer] -= 1;
        this.unitTypesLeft[this.currentPlayer][unit.type] -= 1;
        return true;
    }

    canPlaceUnitType(type, player = this.currentPlayer) {
        return !!type && (this.unitTypesLeft[player]?.[type] || 0) > 0;
    }

    canStackUnit(cell, unit) {
        if (cell.units.length === 0) return true;
        if (cell.units.length >= this.level.maxUnitsPerCell) return false;

        const existingUnit = cell.units[0];

        return existingUnit.player === unit.player &&
            existingUnit.type === unit.type;
    }

    movePlacementUnit(unit, x, y) {
        /* Moves selected unit during placement phase.*/
        if (!unit || this.phase !== GamePhase.PLACEMENT) return false;
        if (unit.player !== this.currentPlayer) return false;
        if (!this.grid.isInBounds(x, y)) return false;
        if (!this.isInSpawnZone(unit.player, y)) return false;
        const target = this.grid.matrix[y][x];
        if (!this.canStackUnit(target, unit)) return false;
        const source = this.grid.matrix[unit.y][unit.x];
        source.units = source.units.filter(u => u !== unit);
        source.owner = source.units.length ? source.units[0].player : null;

        target.units.push(unit);
        target.owner = unit.player;
        unit.x = x;
        unit.y = y;

        return true;
    }

    selectUnit(unit) {
        if (!unit || unit.player !== this.currentPlayer) return;
        this.selectedUnit = unit;
        
        if (!unit.hasActed) {
            
        }
    }

    getTerritory() {
        let p1 = 0, p2 = 0;
        for (let r = 0; r < this.grid.size; r++) {
            for (let c = 0; c < this.grid.size; c++) {
                const owner = this.grid.matrix[r][c].owner;
                if (owner === 1) p1++;
                else if (owner === 2) p2++;
            }
        }
        return { p1, p2 };
    }

    getValidMoves(unit) {
        if (!unit) return [];
        return unit.getValidMoves(this.grid);
    }

    getValidAttacks(unit) {
        if (!unit) return [];
        return unit.getValidAttacks(this.grid);
    }

    renderPlacementUnits() {
        const unitTypes = [
            { type: UnitType.SOLDIER, cssClass: '.soldier'},
            { type: UnitType.RIDER, cssClass: '.rider'},
            { type: UnitType.TANK, cssClass: '.tank'},
        ].filter(({ type }) => (this.initialUnits[type] || 0) > 0);
 
        unitTypes.forEach(({ type, cssClass }) => {
            const container = document.querySelector(cssClass);
            if (!container) {
                console.warn(`renderPlacementUnits: container not found for ${cssClass}`);
                return;
            }
            container.innerHTML = '';
            const unitDiv = document.createElement('div');
            unitDiv.className = 'unit-card';
            unitDiv.dataset.unitType = type;
            unitDiv.innerHTML = `<img src="assets/units/${type.toLowerCase()}.png" class="unit-icon">`;
            container.appendChild(unitDiv);
        });
    }

    performAttack(attacker, defender) {
        if (!attacker || !defender) return;
        const attackResult = attacker.attack(defender);
        if (!attackResult) return false;

        this.recordAction();

        if (defender.health <= 0) {
            const cell = this.grid.matrix[defender.y][defender.x];
            cell.units = cell.units.filter(u => u !== defender);
            cell.owner = cell.units.length ? cell.units[0].player : null;
            this.units[defender.player] = this.units[defender.player].filter(u => u !== defender);
        }

        return attackResult;
    }

    applyCellEffect(unit) {
        if (!unit) return null;

        const cell = this.grid.matrix[unit.y][unit.x];

        switch (cell.type) {
            case CellType.BONUS_ATK:
                unit.force += 1;
                cell.type = CellType.NEUTRAL;
                return `${unit.type} gained +1 attack`;

            case CellType.BONUS_DEF:
                unit.maxHealth += 1;
                unit.health += 1;
                cell.type = CellType.NEUTRAL;
                return `${unit.type} gained +1 health`;

            case CellType.TRAP:
                unit.trapDebuff = true;
                unit.takeDamage(1);
                cell.type = CellType.NEUTRAL;
                if (!unit.alive) {
                    cell.units = cell.units.filter(u => u !== unit);
                    cell.owner = cell.units.length ? cell.units[0].player : null;
                    this.units[unit.player] = this.units[unit.player].filter(u => u !== unit);
                }
                return `${unit.type} stepped on a trap and lost 1 health`;

            default:
                return null;
        }
    }

    recordAction() {
        this.actionsThisTurn += 1;
    }

    hasRemainingMovement() {
        return this.units[this.currentPlayer].some(unit =>
            unit.alive &&
            !unit.hasMoved &&
            this.getValidMoves(unit).length > 0
        );
    }

    shouldAutoEndTurn() {
        return this.actionsThisTurn >= this.maxActionsPerTurn ||
            !this.hasRemainingMovement();
    }

    reset() {
        this.grid = new Grid(this.level.gridSize);
        this.grid.generateSpecials(this.level);

        this.units = { 1: [], 2: [] };

        this.currentPlayer = 1;
        this.placingPlayer = 1;
        this.turnCount = 1;

        this.unitsLeft = {
            1: this.unitsPerPlayer,
            2: this.unitsPerPlayer,
        };
        this.unitTypesLeft = this.#createUnitTypesLeft();
        this.actionsThisTurn = 0;

        this.selectedUnit = null;
        this.selectedPlacementUnit = null;

        this.validMoves = [];
        this.validAttacks = [];

        this.phaseTimedOut = false;

        this.placementIndex = {
            1: 0,
            2: 0
        };

        this.setPhase(GamePhase.PLACEMENT);
    }
}
