import { Scene }      from './Scene.js';
import { SceneType, GamePhase, UnitType, ActionType } from '../../data/Enums.js';
import { GameManager } from '../../core/GameManager.js';
import { Renderer }    from '../Renderer.js';
import { COLORS } from '../../data/Colors.js';

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
        this.errorModal = document.getElementById("error-modal");
        this.attackModal = document.getElementById("attack-modal");
        this.movesLeftText = document.getElementById("moves-left");
        if (this.unitsLeftParagraph) {
            this.unitsLeftParagraph.innerText = this.logic.unitsPerPlayer;
        }
        this.diceRollDiv = document.getElementById("dice-roll");
        if (this.diceRollDiv) {
            this.diceRollDiv.classList.add("hidden");
        }


        this.unitsPanel = document.getElementById("units-panel");
        this.unitsPanel.classList.remove("hidden");

        this.totalOccupiedCells = document.getElementsByClassName("total-occupied-cells");
        
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

        if (this.errorModal) {
            const btn = document.getElementById('error-modal-btn');
            if (btn) btn.onclick = () => this.errorModal.classList.remove('open');
            this.errorModal.onclick = (e) => {
                if (e.target === this.errorModal) {
                    this.errorModal.classList.remove('open');
                }
            };
        }

        if (this.attackModal) {
            const cancelButton = document.getElementById('cancel-attack-btn');
            if (cancelButton) {
                cancelButton.onclick = () => this.attackModal.classList.remove('open');
            }

            this.attackModal.onclick = (e) => {
                if (e.target === this.attackModal) {
                    this.attackModal.classList.remove('open');
                }
            };
        }

        this.renderer.loadUnitAssets(this.logic.level);
        this.logic.dice.loadAssets();
        this.logic.renderPlacementUnits();
        this.#selectPlacementUnitFromPanel();

        this.turnNotice = document.getElementById('turn-notice');
        this.lastUpdateTime = performance.now();
        this.lastPhase = this.logic.phase;
        this.#updatePhaseDisplay();
        this.#updateTimerDisplay();
        this.#updateActionsDisplay();

        this.logic.dice.reset();

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
                    if (this.logic.unitsLeft[2] === this.logic.unitsPerPlayer) {
                        this.logic.ai.placeUnits();
                        this.#updateOccupiedCellsDisplay();
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
                this.unitsPanel.classList.add("hidden");
            };
        }

        const endTurnButton = document.getElementById('end-turn-btn');
        if (endTurnButton) {
            endTurnButton.onclick = () => {
                if (this.logic.phase === GamePhase.PLACEMENT) {
                    if (!this.#verifyPlayerHasPlacedUnits(this.logic.currentPlayer)) {
                        return;
                    }
                    this.unitsLeftParagraph.innerText = this.logic.unitsPerPlayer;
                }

                this.#completeTurn();
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

        if (this.diceRollDiv) {
            // Show the dice roll panel strictly during the Movement phase
            this.diceRollDiv.classList.toggle('hidden', this.logic.phase !== GamePhase.MOVEMENT);
        }
    }

    #updateTimerDisplay() {
        if (!this.timerDisplay || !this.logic) return;

        const seconds = Math.max(0, Math.ceil(this.logic.phaseTimeLeft));
        this.timerDisplay.textContent = `${seconds}s`;
    }

    #updatePlayerTurnDisplay() {
        const activePlayerDiv = document.getElementById("active-player-role");
        const activePlayerNumber = document.getElementById('active-player-number');
        if (activePlayerNumber) {
            activePlayerNumber.innerText = this.logic.currentPlayer;
            if (this.logic.currentPlayer === 1) {
                activePlayerDiv.style.backgroundColor = COLORS.p1Unit;
            }
            else {
                activePlayerDiv.style.backgroundColor = COLORS.p2Unit;
            }
        }
    }

    async #startDiceRoll() {
        this.logic.timerPaused = true;
        await this.logic.dice.performInitialRollsFlow();
        this.logic.timerPaused = false;
        this.#finishDiceRoll();
    }

    #finishDiceRoll() {
        const startingPlayer = this.logic.dice.determineStartingPlayer();
        this.logic.setFirstPlayer(startingPlayer);
        this.#updatePlayerTurnDisplay();
        setTimeout(() => this.#rollForTurnBonus(), 1000);
    }

    async #rollForTurnBonus() {
        await this.logic.dice.performBonusRollFlow(this.logic.currentPlayer);
    }

    #verifyPlayerHasPlacedUnits(player) {
        if (this.logic.unitsLeft[player] === this.logic.unitsPerPlayer) {
            this.errorModal.classList.add("open");
            document.getElementById("error-text").innerText = `Player ${player}: place at least one unit on the grid!`
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
                if (!this.logic.canPlaceUnitType(type)) return;

                document.querySelectorAll('.unit-card')
                    .forEach(c => c.classList.remove('selected'));

                card.classList.add('selected');
                this.logic.selectedPlacementUnit = type;
                this.logic.selectedUnit = null;
            });
        });
    }

    #updateOccupiedCellsDisplay() {
        const territory = this.logic.getTerritory();

        this.totalOccupiedCells[0].innerText = territory.p1;
        this.totalOccupiedCells[1].innerText = territory.p2;
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
                    this.#updateOccupiedCellsDisplay();
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
                    this.#updateOccupiedCellsDisplay();
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

            if (clickedUnit && clickedUnit === this.logic.selectedUnit) {
                this.logic.selectedUnit = null;
                this.logic.validMoves = [];
                this.logic.validAttacks = [];
                return;
            }

            // Move selected unit
            if (this.logic.selectedUnit && !this.logic.selectedUnit.hasMoved) {
                const isValidMove = this.logic.validMoves.some(
                    move => move.x === coords.x && move.y === coords.y
                );

                if (isValidMove) {
                    const moved = this.#moveUnit(
                        this.logic.selectedUnit,
                        coords.x,
                        coords.y
                    );

                    if (moved) {
                        const movedUnits = this.logic.grid.matrix[coords.y][coords.x].units;
                        this.#notifyCellEffect(movedUnits[movedUnits.length - 1]);
                        this.#updateOccupiedCellsDisplay();
                        this.logic.recordAction();
                        this.#updateActionsDisplay();
                        this.#autoEndTurnIfNeeded();
                        return;
                    }
                }
            }

            // Show attack modal when clicking valid attack
            if (this.logic.selectedUnit && !this.logic.selectedUnit.hasActed) {
                const isValidAttack = this.logic.validAttacks.some(
                    attack => attack.x === coords.x && attack.y === coords.y
                );

                if (isValidAttack) {
                    const attacker = this.logic.selectedUnit;
                    const defender = clickedUnit;

                    this.#showAttackModal(attacker, defender);
                    return;
                }
            }

            // Select own unit
            if (clickedUnit && clickedUnit.player === this.logic.currentPlayer) {
                this.#selectBattleUnit(clickedUnit);
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

    #showAttackModal(attacker, defender) {
        if (!this.attackModal || !attacker || !defender) return;

        const attackerName = document.getElementById("attacker-name");
        if (attackerName) {
            attackerName.innerText = attacker.type;
        }
        const attackerHp = document.getElementById("attacker-hp");
        if (attackerHp) {
            attackerHp.innerText = attacker.health;
        }
        const attackerAttack = document.getElementById("attacker-attack");
        if (attackerAttack) {
            const bonusText = this.logic.dice.bonus > 0 ? ` (+${this.logic.dice.bonus})` : "";
            attackerAttack.innerText = `${attacker.force}${bonusText}`;
        }

        const defenderName = document.getElementById("defender-name");
        if (defenderName) {
            defenderName.innerText = defender.type;
        }
        const defenderHp = document.getElementById("defender-hp");
        if (defenderHp) {
            defenderHp.innerText = defender.health;
        }
        const defenderDefense = document.getElementById("defender-defense");
        if (defenderDefense) {
            defenderDefense.innerText = defender.defense;
        }

        const battleTip = document.getElementById("battle-tip");
        if (battleTip) {
            battleTip.innerText =
                `${attacker.type} attacks ${defender.type}`;
        }

        const attackButton = document.getElementById("confirm-attack-btn");
        if (attackButton) {
            attackButton.onclick = () => {
                this.#performAttack(attacker, defender);
                this.attackModal.classList.remove("open");
            };
        }

        this.attackModal.classList.add("open");
    }

    #performAttack(attacker, defender) {
        if (!attacker || !defender) return;
        const attacked = this.logic.performAttack(attacker, defender);
        if (!attacked) return;

        this.#updateOccupiedCellsDisplay();
        this.logic.selectedUnit = null;
        this.logic.validMoves = [];
        this.logic.validAttacks = [];
        this.#updateActionsDisplay();
        this.#autoEndTurnIfNeeded();
    }

    #selectBattleUnit(unit) {
        this.logic.selectedUnit = unit;

        this.logic.validMoves = unit.hasMoved
            ? []
            : this.logic.getValidMoves(unit);

        this.logic.validAttacks = unit.hasActed
            ? []
            : this.logic.getValidAttacks(unit);
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
        this.logic.validAttacks = [];

        return true;
    }

    update() {
        if (this.logic && this.logic.phase !== this.lastPhase) {
            this.lastPhase = this.logic.phase;
            this.#updatePhaseDisplay();
        }
        this.#updateTimer();
        if (this.logic?.phaseTimedOut && [GamePhase.MOVEMENT, GamePhase.ACTION].includes(this.logic.phase)) {
            this.#completeTurn();
        }
    }

    #autoEndTurnIfNeeded() {
        if (!this.logic || this.logic.phase !== GamePhase.MOVEMENT) return;
        if (!this.logic.shouldAutoEndTurn()) return;

        this.#completeTurn();
    }

    #completeTurn() {
        this.logic.nextPlayerTurn();
        this.#updateTimerDisplay();
        this.#updatePlayerTurnDisplay();
        this.#updateActionsDisplay();

        // Only roll for attack bonuses during active gameplay phases, not during placement
        if (this.logic.phase !== GamePhase.PLACEMENT && this.logic.phase !== GamePhase.FINISHED) {
            this.#rollForTurnBonus();
        }

        if (this.logic.units) {
            this.logic.units[this.logic.currentPlayer].forEach(unit => {
                unit.resetTurn();
            });
        }
    }

    #showTurnNotice(message) {
        if (!this.turnNotice) return;
        this.turnNotice.textContent = message;
        this.turnNotice.classList.remove('hidden');
        this.turnNotice.classList.add('visible');
        clearTimeout(this.turnNoticeTimeout);
        this.turnNoticeTimeout = setTimeout(() => {
            this.turnNotice?.classList.remove('visible');
            this.turnNotice?.classList.add('hidden');
        }, 1200);
    }

    #notifyCellEffect(unit) {
        const message = this.logic.applyCellEffect(unit);
        if (message) {
            this.#showTurnNotice(message);
        }
    }

    #updateActionsDisplay() {
        if (!this.movesLeftText || !Number.isFinite(this.logic.maxActionsPerTurn)) return;

        this.movesLeftText.innerText = Math.max(
            0,
            this.logic.maxActionsPerTurn - this.logic.actionsThisTurn
        );
    }

    draw(ctx) {
        if (this.renderer && this.logic) {
            this.renderer.draw(this.logic);
        }
    }

}
