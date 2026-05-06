import { GamePhase, UnitType } from '../data/Enums.js';
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

        this.units = { 1: [], 2: [] }; 
        this.players = { 1: { name: 'P1' }, 2: { name: 'P2' } };

        this.currentPlayer = 1;
        this.placingPlayer = 1;
        this.turnCount = 1;
        this.unitsLeft = {
            1: this.level.unitsPerPlayer,
            2: this.level.unitsPerPlayer,
        };
        
        this.selectedUnit = null;
        this.validMoves = [];
        this.validAttacks = [];
        
        this.ai = new AIPlayer(this);

        this.phaseTimers = this.level.phaseTimers || {
            [GamePhase.PLACEMENT]: 30,
            [GamePhase.MOVEMENT]: this.level.time_per_turn || 60,
            [GamePhase.ACTION]: 20,
            [GamePhase.FINISHED]: 0,
        };

        this.placementOrder = [
            UnitType.SOLDIER,
            UnitType.TANK,
            UnitType.SOLDIER,
            UnitType.RIDER,
            UnitType.SOLDIER
        ];
        this.placementIndex = { 1: 0, 2: 0 };

        this.setPhase(GamePhase.PLACEMENT);
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

    initUnits() {
        const order = [UnitType.SOLDIER, UnitType.TANK, UnitType.SOLDIER, UnitType.RIDER, UnitType.SOLDIER];

        for (let index = 0; index < this.unitsLeft[1]; index++) {
            const type = order[index] || UnitType.SOLDIER;
            const p1Cell = this.grid.matrix[this.grid.size - 1][index];
            const p2Cell = this.grid.matrix[0][index];

            const p1Unit = this.createUnit(type, 1, index, this.grid.size - 1);
            this.units[1].push(p1Unit);
            p1Cell.units.push(p1Unit);
            p1Cell.owner = 1;

            const p2Unit = this.createUnit(type, 2, index, 0);
            this.units[2].push(p2Unit);
            p2Cell.units.push(p2Unit);
            p2Cell.owner = 2;
        }
    }

    isInSpawnZone(player, y) {
        const spawnRows = this.level.spawnRows;
        return player === 1
            ? y >= this.grid.size - spawnRows
            : y < spawnRows;
    }

    movePlacementUnit(unit, x, y) {
        if (!unit || this.phase !== GamePhase.PLACEMENT) return false;
        if (unit.player !== 1) return false;
        if (!this.grid.isInBounds(x, y)) return false;

        const target = this.grid.matrix[y][x];
        if (target.units.length >= 2) return false;
        if (target.units.length > 0 && target.units[0].player !== unit.player) return false;
        if (!this.isInSpawnZone(unit.player, y)) return false;

        const source = this.grid.matrix[unit.y][unit.x];
        source.units = source.units.filter(u => u !== unit);
        source.owner = source.units.length ? source.units[0].player : null;

        target.units.push(unit);
        target.owner = unit.player;
        unit.x = x;
        unit.y = y;

        return true;
    }

    placeUnit(unitType, x, y) {
        const chosenType = unitType || this.placementOrder[this.placementIndex[this.placingPlayer]];
        if (!chosenType) return false;

        const cell = this.grid.matrix[y][x];
        if (cell.units && cell.units.length >= 2) return false;
        if (cell.units && cell.units.length === 1 && cell.units[0].player !== this.placingPlayer) return false;

        const spawnRows = this.level.spawnRows;
        const isInZone = (this.placingPlayer === 1)
            ? (y >= this.grid.size - spawnRows)
            : (y < spawnRows);

        if (!isInZone) return false;

        const unit = this.createUnit(chosenType, this.placingPlayer, x, y);
        cell.owner = this.placingPlayer;
        cell.units.push(unit);
        this.units[this.placingPlayer].push(unit);
        this.placementIndex[this.placingPlayer]++;

        this.unitsLeft[this.placingPlayer]--;

        if (this.unitsLeft[1] === 0 && this.unitsLeft[2] === 0) {
            this.setPhase(GamePhase.MOVEMENT);
            this.currentPlayer = 1;
        } else if (this.unitsLeft[this.placingPlayer] === 0) {
            this.placingPlayer = this.placingPlayer === 1 ? 2 : 1;
        }

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

    getValidCaptures(unit) {
        return [];
    }

    renderUnitsInfo() {
        console.log(this.units);
        const player1Units = this.units["1"];

        const containers = {
            SOLDIER: document.querySelector('.soldier'),
            RIDER: document.querySelector('.rider'),
            TANK: document.querySelector('.tank')
        };

        Object.values(containers).forEach(container => {
            if (container) container.innerHTML = '';
        });

        player1Units.forEach(unit => {
            const unitDiv = document.createElement('div');
            unitDiv.className = 'unit-card';
            unitDiv.innerHTML = `
            <img src="assets/units/${unit.type.toLowerCase()}.png" class="unit-icon">
            <div class="unit-info">
            <span>${unit.name}</span>
            <div class="unit-stats">
                <span>Health: ${unit.health}</span>
                <span>Move: ${unit.moveRange}</span>
                <span>Force: ${unit.force}</span>
            </div>
            </div>
        `;

            const target = containers[unit.type];
            if (target) {
                target.appendChild(unitDiv);
            }
        });
    }
}

