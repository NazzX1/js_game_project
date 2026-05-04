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
        this.phase = GamePhase.PLACEMENT;
        this.turnCount = 1;
        this.unitsLeft = {
            1: this.level.unitsPerPlayer,
            2: this.level.unitsPerPlayer,
        };
        
        this.selectedUnit = null;
        this.validMoves = [];
        this.validAttacks = [];
        
        this.ai = new AIPlayer(this);
        this.initUnits();
        this.renderUnits();
    }

    setFirstPlayer(player) {
        this.currentPlayer = player;
        this.placingPlayer = player;
    }


    initUnits() {
        let unit;

        unit = new Soldier(1, 0, this.grid.size - 1);
        this.units[1].push(unit);
        this.grid.matrix[this.grid.size - 1][0].units.push(unit);
        this.grid.matrix[this.grid.size - 1][0].owner = 1;

        unit = new Soldier(2, 0, 0);
        this.units[2].push(unit);
        this.grid.matrix[0][0].units.push(unit);
        this.grid.matrix[0][0].owner = 2;

        unit = new Soldier(1, 2, this.grid.size - 1);
        this.units[1].push(unit);
        this.grid.matrix[this.grid.size - 1][2].units.push(unit);
        this.grid.matrix[this.grid.size - 1][2].owner = 1;

        unit = new Tank(1, 1, this.grid.size - 1);
        this.units[1].push(unit);
        this.grid.matrix[this.grid.size - 1][1].units.push(unit);
        this.grid.matrix[this.grid.size - 1][1].owner = 1;

        unit = new Tank(2, 1, 0);
        this.units[2].push(unit);
        this.grid.matrix[0][1].units.push(unit);
        this.grid.matrix[0][1].owner = 2;

        unit = new Rider(1, 3, this.grid.size - 1);
        this.units[1].push(unit);
        this.grid.matrix[this.grid.size - 1][3].units.push(unit);
        this.grid.matrix[this.grid.size - 1][3].owner = 1;

        unit = new Rider(2, 3, 0);
        this.units[2].push(unit);
        this.grid.matrix[0][3].units.push(unit);
        this.grid.matrix[0][3].owner = 2;
    }

    placeUnit(unitType, x, y) {
        const chosenType = unitType || this.placementOrder[this.placementIndex[this.placingPlayer]];
        if (!chosenType) return false;

        const cell = this.grid.matrix[y][x];
        if (cell.units && cell.units.length > 0) return false;

        const spawnRows = this.level.spawnRows;
        const isInZone = (this.placingPlayer === 1)
            ? (y >= this.grid.size - spawnRows)
            : (y < spawnRows);

        if (!isInZone) return false;

        const stats = this.level.units[chosenType];
        if (!stats) return false;

        const unit = new Unit(chosenType, stats, this.placingPlayer, x, y);
        cell.owner = this.placingPlayer;
        cell.units.push(unit);
        this.units[this.placingPlayer].push(unit);
        this.placementIndex[this.placingPlayer]++;

        this.unitsLeft[this.placingPlayer]--;

        if (this.unitsLeft[1] === 0 && this.unitsLeft[2] === 0) {
            this.phase = GamePhase.MOVEMENT;
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
    
        return []; 
    }

    getValidCaptures(unit) {
        return [];
    }

    renderUnits() {
        console.log(this.units);
    const player1Units = this.units["1"];

    const containers = {
        SOLDIER: document.querySelector('.soldier'),
        RIDER: document.querySelector('.rider'),
        TANK: document.querySelector('.tank')
    };

    player1Units.forEach(unit => {
        const unitDiv = document.createElement('div');
        unitDiv.className = 'unit-card';
        unitDiv.innerHTML = `
        <img src="assets/units/${unit.type.toLowerCase()}.png" class="unit-icon">
        <div class="unit-info">
        <span>${unit.name}</span>
        <div class="unit-stats">
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

