import { GamePhase, UnitType } from '../data/Enums.js';
import { Levels } from '../data/Levels.js';
import { Grid } from './Grid.js';
import { Unit } from './Unit.js';
import { AIPlayer } from './AIPlayer.js';

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
    }

    setFirstPlayer(player) {
        this.currentPlayer = player;
        this.placingPlayer = player;
    }

    placeUnit(unitType, x, y) {
        const cell = this.grid.matrix[y][x];
        
        if (cell.units && cell.units.length > 0) return false;
        
        const spawnRows = this.level.spawnRows;
        const isInZone = (this.placingPlayer === 1) 
            ? (y >= this.grid.size - spawnRows)
            : (y < spawnRows);
        
        if (!isInZone) return false;
        
        const stats = this.level.units[unitType];
        
        const unit = new Unit(unitType, stats, this.placingPlayer, x, y);
        cell.owner = this.placingPlayer;
        cell.units.push(unit);
        
        this.unitsLeft[this.placingPlayer]--;
        
        if (this.unitsLeft[1] === 0 && this.unitsLeft[2] === 0) {
            this.phase = GamePhase.MOVEMENT;
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
}

