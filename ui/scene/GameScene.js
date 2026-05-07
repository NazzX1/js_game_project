import { Scene }      from './Scene.js';
import { SceneType, GamePhase, UnitType, ActionType } from '../../data/Enums.js';
import { GameManager } from '../../core/GameManager.js';
import { Renderer }    from '../Renderer.js';

export class GameScene extends Scene {
    
    constructor(app) {
        super();
        this.app      = app;
        this.logic    = null;
        this.renderer = null;
        this.vsAI     = true;
        this.timerDisplay = null;
        this.turnNotice = null;
        this.turnNoticeTimeout = null;
        this.lastUpdateTime = 0;
        this._clickHandler = (e) => this.#handleCanvasClick(e);
    }

    onEnter() {
        const gameSceneElement = document.getElementById('game-scene');
        if (gameSceneElement) {
            gameSceneElement.classList.remove('hidden', 'fade-out');
        }

        this.logic    = new GameManager(1);
        this.renderer = new Renderer('game-canvas', this.logic.config.gridSize);
        this.vsAI     = this.app.vsAI !== false;
        this.timerDisplay = document.getElementById('timer-display');
        this.placementModal = document.getElementById('placement-modal');

        if (this.placementModal) {
            this.placementModal.classList.add('open');
            const btn = document.getElementById('placement-modal-btn');
            if (btn) btn.onclick = () => this.placementModal.classList.remove('open');
            this.placementModal.onclick = (e) => {
                if (e.target === this.placementModal) {
                    this.placementModal.classList.remove('open');
                }
            };
        }

        this.renderer.loadUnitAssets(this.logic.level);
        this.logic.initUnits();
        this.logic.renderUnitsInfo();

        this.turnNotice = document.getElementById('turn-notice');
        this.lastUpdateTime = performance.now();
        this.#updateTimerDisplay();

        this.renderer.canvas.onclick = this._clickHandler;

        const doneButton = document.getElementById('placement-done-btn');
        if (doneButton) {
            doneButton.classList.toggle('hidden', this.logic.phase !== GamePhase.PLACEMENT);
            doneButton.onclick = () => {
                if (this.logic.phase === GamePhase.PLACEMENT) {
                    this.logic.setPhase(GamePhase.MOVEMENT);
                    this.logic.selectedUnit = null;
                    doneButton.classList.add('hidden');
                    this.#updateTimerDisplay();
                }
            };
        }

        const endTurnButton = document.getElementById('end-turn-btn');
        if (endTurnButton) {
            endTurnButton.onclick = () => {
                this.logic.nextPlayerTurn();
                this.#updateTimerDisplay();
                this.#updatePlayerTurnDisplay();
            };
        }

        const menuButton = document.getElementById('menu-btn');
        if (menuButton) {
            menuButton.onclick = () => {
                this.app.switchScene(SceneType.HOME);
            };
        }
    }

    onExit() {
        document.getElementById('game-scene').classList.add('hidden');
        if (this.renderer) {
            this.renderer.canvas.onclick = null;
        }
        if (this.placementModal) {
            this.placementModal.classList.remove('open');
        }
        if (this.logic) {
            this.logic.selectedUnit = null;
            this.logic.validMoves = [];
        }
    }

    #updateTimer() {
        if (!this.logic || !this.timerDisplay) return;

        const now = performance.now();
        const deltaMs = now - this.lastUpdateTime;
        this.lastUpdateTime = now;

        this.logic.updatePhaseTimer(deltaMs);
        this.#updateTimerDisplay();
    }

    #updateTimerDisplay() {
        if (!this.timerDisplay || !this.logic) return;

        const seconds = Math.max(0, Math.ceil(this.logic.phaseTimeLeft));
        this.timerDisplay.textContent = `${seconds}s`;
    }

    #updatePlayerTurnDisplay() {
    const turnCard = document.querySelector('.active-player-card');

    if (turnCard) {
        Array.from(turnCard.children).forEach(child => {
            child.classList.toggle('active-player');
            child.classList.toggle("hidden");
        });
    }
    }

    #handleCanvasClick(event) {
        if (!this.logic) return;

        const coords = this.renderer.getGridCoords(event);
        if (!coords) return;

        const cell = this.logic.grid.matrix[coords.y][coords.x];
        const unit = cell.units[0];

        if (this.logic.phase === GamePhase.PLACEMENT) {
            if (!this.logic.isInSpawnZone(1, coords.y)) return;

            if (!this.logic.selectedUnit) {
                if (!unit || unit.player !== 1) return;
                this.logic.selectedUnit = unit;
                return;
            }

            if (unit && unit.player === 1) {
                this.logic.selectedUnit = unit;
                return;
            }

            if (this.logic.movePlacementUnit(this.logic.selectedUnit, coords.x, coords.y)) {
                this.logic.selectedUnit = null;
            }
        } else if (this.logic.phase === GamePhase.MOVEMENT) {
            if (this.vsAI && this.logic.currentPlayer === 2) {
                this.#showTurnNotice('Not your turn');
                return;
            }

            if (unit && unit.player === this.logic.currentPlayer) {
                if (this.logic.selectedUnit && this.logic.selectedUnit.x === unit.x && this.logic.selectedUnit.y === unit.y) {
                    this.logic.selectedUnit = null;
                    this.logic.validMoves = [];
                } else {
                    this.logic.selectedUnit = unit;
                    this.logic.validMoves = this.logic.getValidMoves(unit);
                }
                return;
            }

            if (unit && unit.player !== this.logic.currentPlayer) {
                this.#showTurnNotice('Not your turn');
                return;
            }

            if (this.logic.selectedUnit) {
                const isValidMove = this.logic.validMoves.some(m => m.x === coords.x && m.y === coords.y);
                if (isValidMove && !unit) {
                    this.#moveUnit(this.logic.selectedUnit, coords.x, coords.y);
                }
            }
        }
    }

    #moveUnit(unit, x, y) {
        if (!unit) return;

        const source = this.logic.grid.matrix[unit.y][unit.x];
        source.units = source.units.filter(u => u !== unit);
        source.owner = source.units.length ? source.units[0].player : null;

        const target = this.logic.grid.matrix[y][x];
        if (target.units.length >= 2) return;
        target.units.push(unit);
        target.owner = unit.player;

        unit.x = x;
        unit.y = y;
        unit.hasMoved = true;

        this.logic.selectedUnit = null;
        this.logic.validMoves = [];
    }

    update() {
        this.#updateTimer();
        if (this.logic?.phaseTimedOut && [GamePhase.MOVEMENT, GamePhase.ACTION].includes(this.logic.phase)) {
            this.logic.nextPlayerTurn();
            this.#updateTimerDisplay();
            this.#updatePlayerTurnDisplay();
        }
    }

    #showTurnNotice(message) {
        if (!this.turnNotice) return;
        this.turnNotice.textContent = message;
        this.turnNotice.classList.add('visible');
        clearTimeout(this.turnNoticeTimeout);
        this.turnNoticeTimeout = setTimeout(() => {
            this.turnNotice?.classList.remove('visible');
        }, 1200);
    }

    draw(ctx) {
        if (this.renderer && this.logic) {
            this.renderer.draw(this.logic);
        }
    }
}