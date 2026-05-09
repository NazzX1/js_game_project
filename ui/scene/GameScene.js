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
        this.vsAI     = this.app.vsAI;
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
        this. unitsLeftParagraph = document.getElementById("units-left");
        if (this.unitsLeftParagraph) {
            this.unitsLeftParagraph.innerText = this.logic.level.unitsPerPlayer;
        }
        this.diceRollDiv = document.getElementById("dice-roll");
        if (this.diceRollDiv) {
            this.diceRollDiv.classList.add("hidden");
        }

        this.rollDiceButton = document.getElementById('roll-dice-btn');
        this.rollDiceButton.disabled = false;
        this.diceValueText = document.getElementById("dice-value");
        this.diceValueText.innerHTML = "";
        
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

        this.#resetDiceRoll();

         // left click
        this.renderer.canvas.addEventListener('click', this._leftClickHandler);

        // right click
        this.renderer.canvas.addEventListener('contextmenu', this._rightClickHandler);

        const doneButton = document.getElementById('placement-done-btn');
        if (doneButton) {
            doneButton.classList.toggle('hidden', this.logic.phase !== GamePhase.PLACEMENT);
            doneButton.onclick = () => {
                if (this.logic.phase !== GamePhase.PLACEMENT) return;

                if (!this.#verifyPlayerHasPlacedUnits(1)) return;

                if (this.vsAI) {
                    if (this.logic.unitsLeft[2] === this.logic.level.unitsPerPlayer) {
                        this.logic.ai.placeUnits();
                    }
                } else {
                    if (!this.#verifyPlayerHasPlacedUnits(2)) return;
                }

                this.logic.setPhase(GamePhase.MOVEMENT);

                this.#startDiceRoll();
                this.logic.currentPlayer = 1;
                this.logic.selectedUnit = null;
                this.logic.selectedPlacementUnit = null;

                doneButton.classList.add('hidden');
                this.#updatePhaseDisplay();
                this.#updateTimerDisplay();
                document.querySelector(".placement-hint")?.classList.add("hidden");
            };
        }

        const endTurnButton = document.getElementById('end-turn-btn');
        if (endTurnButton) {
            endTurnButton.onclick = () => {
                if (this.logic.phase === GamePhase.PLACEMENT) {
                    if (!this.#verifyPlayerHasPlacedUnits(this.logic.currentPlayer)) {
                        return;
                    }
                    this.unitsLeftParagraph.innerText = this.logic.level.unitsPerPlayer;
                }

                this.logic.nextPlayerTurn();
                this.#updateTimerDisplay();
                this.#updatePlayerTurnDisplay();
            };
        }

        const menuButton = document.getElementById('menu-btn');
        if (menuButton) {
            menuButton.onclick = () => {
                this.app.switchScene(SceneType.HOME);
                this.logic.reset();
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
        const activePlayerNumber = document.getElementById('active-player-number');
        if (activePlayerNumber) {
            activePlayerNumber.innerText = this.logic.currentPlayer;
        }
    }

    #startDiceRoll() {
        const diceTurnText = document.getElementById('dice-turn-text');
        const startingPlayerText = document.getElementById("starting-player");

        this.#resetDiceRoll();
        this.diceRollDiv?.classList.remove('hidden');

        this.rollDiceButton.onclick = () => {
            const player = this.logic.dicePlayerTurn;
            const roll = Math.ceil(Math.random() * 6);

            this.logic.diceRolls[player] = roll;
            this.diceValueText.innerHTML += `<p>Player ${player} got ${roll}</p>`;

            if (player === 1 && !this.vsAI) {
                this.logic.dicePlayerTurn = 2;
                diceTurnText.innerText = "Player 2 roll";
                return;
            }

            if (player === 1 && this.vsAI) {
                const aiRoll = Math.ceil(Math.random() * 6);
                this.logic.diceRolls[2] = aiRoll;
                this.diceValueText.innerHTML += `<p>Player 2 got ${aiRoll}</p>`;
            }

            this.#finishDiceRoll(startingPlayerText);
        };
    }

    #finishDiceRoll(startingPlayerText) {
        const p1 = this.logic.diceRolls[1];
        const p2 = this.logic.diceRolls[2];

        if (p1 > p2) {
            this.logic.setFirstPlayer(1);
            startingPlayerText.innerText = "Player 1 starts";
        } else {
            this.logic.setFirstPlayer(2);
            startingPlayerText.innerText = "Player 2 starts";
        }

        this.rollDiceButton.disabled = true;
        this.#updatePlayerTurnDisplay();
    }

    #verifyPlayerHasPlacedUnits(player) {
        if (this.logic.unitsLeft[player] === this.logic.level.unitsPerPlayer) {
            alert(`Player ${player}: place at least one unit on the grid!`);
            return false;
        }

        return true;
    }

    #selectPlacementUnitFromPanel() {
        const cards = document.querySelectorAll('.unit-card');

        cards.forEach(card => {
            card.addEventListener('click', () => {
                if (this.logic.unitsLeft[this.logic.currentPlayer] === 0) {
                    document.querySelectorAll('.unit-card')
                        .forEach(c => c.classList.remove('selected'));

                    this.logic.selectedPlacementUnit = null;
                    return;
                }

                const type = card.dataset.unitType;
                if (!type) return;

                document.querySelectorAll('.unit-card')
                    .forEach(c => c.classList.remove('selected'));

                card.classList.add('selected');
                this.logic.selectedPlacementUnit = type;
                this.logic.selectedUnit = null;
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

            // Place units from panel.
            if ( this.logic.selectedPlacementUnit) {
                const placed = this.logic.placeUnit(coords);

                if (placed) {
                    this.unitsLeftParagraph.innerText = this.logic.unitsLeft[this.logic.currentPlayer];
                    this.logic.selectedPlacementUnit = null;
                }

                return;
            }

            // Move already placed units on the grid.
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

            // Select clicked unit.
            if (clickedUnit && clickedUnit.player === this.logic.currentPlayer) {
                this.logic.selectedUnit = clickedUnit;
                //console.log("selected unit:", clickedUnit);
                return;
            }
        }

        if (this.logic.phase === GamePhase.MOVEMENT) {
            if (this.logic.selectedUnit) {

                const isValidMove = this.logic.validMoves.some(
                    move => move.x === coords.x && move.y === coords.y
                );

                if (isValidMove) {
                    const moved = this.#moveUnit(
                        this.logic.selectedUnit,
                        coords.x,
                        coords.y
                    );

                    if (moved) return;
                }

                if (
                    clickedUnit &&
                    clickedUnit.player === this.logic.currentPlayer &&
                    clickedUnit !== this.logic.selectedUnit
                ) {
                    this.logic.selectedUnit = clickedUnit;
                    this.logic.validMoves = this.logic.getValidMoves(clickedUnit);
                    return;
                }
            }

            if (clickedUnit && clickedUnit.player === this.logic.currentPlayer) {
                this.logic.selectedUnit = clickedUnit;
                this.logic.validMoves = this.logic.getValidMoves(clickedUnit);
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
        if (!unit) return false;

        const isValidMove = this.logic.validMoves.some(
            move => move.x === x && move.y === y
        );

        if (!isValidMove) return false;

        const target = this.logic.grid.matrix[y][x];
        if (!this.logic.canStackUnit(target, unit)) return false;
        
        const source = this.logic.grid.matrix[unit.y][unit.x];
        source.units = source.units.filter(u => u !== unit);
        
        target.units.push(unit);
        target.owner = unit.player;

        unit.x = x;
        unit.y = y;
        unit.hasMoved = true;

        this.logic.selectedUnit = null;
        this.logic.validMoves = [];

        return true;
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

    #resetDiceRoll() {

        this.logic.diceRolls = {
            1: null,
            2: null
        };

        this.logic.dicePlayerTurn = 1;

        if (this.diceRollDiv) {
            this.diceRollDiv.classList.add("hidden");
        }

        if (this.rollDiceButton) {
            this.rollDiceButton.disabled = false;
            this.rollDiceButton.onclick = null;
        }

        if (this.diceValueText) {
            this.diceValueText.innerHTML = "";
        }

        const startingPlayerText =
            document.getElementById("starting-player");

        if (startingPlayerText) {
            startingPlayerText.innerText = "";
        }

        const diceTurnText =
            document.getElementById("dice-turn-text");

        if (diceTurnText) {
            diceTurnText.innerText = "Player 1 roll";
        }
    }
}