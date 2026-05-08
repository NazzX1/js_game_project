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
        this._leftClickHandler = (e) => this.#handleCanvasClick(e);
        this._rightClickHandler = (e) => this.#handleCanvasRightClick(e);
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
        this.phaseDisplay = document.getElementById('phase-display');
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
        this.logic.renderPlacementUnits();
        this.#selectPlacementUnitFromPanel();

        this.turnNotice = document.getElementById('turn-notice');
        this.lastUpdateTime = performance.now();
        this.lastPhase = this.logic.phase;
        this.#updatePhaseDisplay();
        this.#updateTimerDisplay();

         // left click
        this.renderer.canvas.addEventListener('click', this._leftClickHandler);

        // right click
        this.renderer.canvas.addEventListener('contextmenu', this._rightClickHandler);

        const doneButton = document.getElementById('placement-done-btn');
        if (doneButton) {
            doneButton.classList.toggle('hidden', this.logic.phase !== GamePhase.PLACEMENT);
            doneButton.onclick = () => {
                if (this.logic.phase === GamePhase.PLACEMENT) {
                    this.logic.setPhase(GamePhase.MOVEMENT);
                    this.logic.selectedUnit = null;
                    this.logic.ai.placeUnits();
                    doneButton.classList.add('hidden');
                    this.#updatePhaseDisplay();
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

    #updatePhaseDisplay() {
        if (!this.phaseDisplay || !this.logic) return;
        const phaseLabels = {
            [GamePhase.PLACEMENT]: 'Placement',
            [GamePhase.MOVEMENT]: 'Movement',
            [GamePhase.ACTION]: 'Action',
            [GamePhase.FINISHED]: 'Finished',
        };
        this.phaseDisplay.textContent = phaseLabels[this.logic.phase] || this.logic.phase;
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

    #selectPlacementUnitFromPanel() {
        const cards = document.querySelectorAll('.unit-card');
        cards.forEach(card => {
            card.addEventListener('click', () => {
                const type = card.dataset.unitType;
                if (!type) return;
                document.querySelectorAll('.unit-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.logic.selectedPlacementUnit = type;
            });
        });
    }

    #handleCanvasClick(event) {
        if (!this.logic) return;

        const coords = this.renderer.getGridCoords(event);
        if (!coords) return;

        const cell = this.logic.grid.matrix[coords.y][coords.x];
        const clickedUnit = cell.units[0];

        if (this.logic.phase === GamePhase.PLACEMENT) {

            if (this.logic.selectedPlacementUnit) {
                const placed = this.logic.placeUnit(coords);

                if (placed) {
                    const unitsLeftParagraph = document.getElementById("units-left");
                    unitsLeftParagraph.innerText = this.logic.unitsLeft[this.logic.placingPlayer];
                    this.logic.selectedPlacementUnit = null;
                }

                return;
            }

            if (clickedUnit && clickedUnit.player === this.logic.currentPlayer) {
                this.logic.selectedUnit = clickedUnit;
                //console.log("selected unit:", clickedUnit);
                return;
            }

            if (this.logic.selectedUnit) {
                const moved = this.logic.movePlacementUnit(
                    this.logic.selectedUnit,
                    coords.x,
                    coords.y
                );

                if (moved) {
                    this.logic.selectedUnit = null;
                }
                return;
            }
        }
    }

    #handleCanvasRightClick(event) {
        event.preventDefault();
        if (!this.logic) return;

        const coords = this.renderer.getGridCoords(event);
        if (!coords) return;

        const cell = this.logic.grid.matrix[coords.y][coords.x];

        if (this.logic.phase === GamePhase.PLACEMENT) {
            if (!this.logic.isInSpawnZone(this.logic.currentPlayer, coords.y)) return;
            this.logic.removeUnit(cell.units[cell.units.length - 1]);
            const unitsLeftParagagraph = document.getElementById("units-left");
            unitsLeftParagagraph.innerText = this.logic.unitsLeft[this.logic.currentPlayer];
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
        if (this.logic && this.logic.phase !== this.lastPhase) {
            this.lastPhase = this.logic.phase;
            this.#updatePhaseDisplay();
        }
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