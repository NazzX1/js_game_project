export class Dice {
    constructor() {
        this.rolls = { 1: null, 2: null };
        this.playerTurn = 1;
        this.bonus = 0;
        this.assets = { 1: {}, 2: {} };

        this.diceRollDiv = document.getElementById("dice-roll");
        this.rollDiceButton = document.getElementById('roll-dice-btn');
        this.diceValueText = document.getElementById("dice-value");
        this.diceImgContainer = document.getElementById("dice-img-container");
        this.diceTurnText = document.getElementById("dice-turn-text");

        this.startPlayerModal = document.getElementById("start-player-modal");
        this.startDiceImgContainer = document.getElementById("start-dice-img-container");
        this.startDiceValueText = document.getElementById("start-dice-value");
        this.startDiceTurnText = document.getElementById("start-dice-turn-text");
        this.startContinueBtn = document.getElementById("start-continue-btn");
        this.reset();
    }

    roll() {
        return Math.ceil(Math.random() * 6);
    }

    async loadAssets() {
        const dice_paths = [];
        for (let v = 1; v <= 6; v++) {
            dice_paths.push({ value: v, path: `./assets/dice/dice_${v}.png` });
        }

        const loadedImages = await Promise.all(dice_paths.map(d => {
            return new Promise(resolve => {
                const img = new Image();
                img.onload = () => {
                    this.assets[1][d.value] = img;
                    this.assets[2][d.value] = img;
                    resolve();
                };
                img.onerror = () => {
                    console.warn(`Dice asset failed: ${d.path}`);
                    resolve();
                };
                img.src = d.path;
            });
        }));

    }

    async #animateRoll(player, finalValue, messagePrefix, imgContainer, valueText) {
        const values = Array.isArray(finalValue) ? finalValue : [finalValue];
        const iterations = 12;
        const speed = 120; 
        
        if (imgContainer) {
            imgContainer.innerHTML = "";
        }

        const imgs = values.map((_, index) => {
            const img = document.createElement('img');
            img.className = values.length > 1 ? 'dice-icon-sm' : 'dice-icon';
            imgContainer.appendChild(img);
            return img;
        });

        imgs.forEach(img => img.classList.add('dice-rolling'));

        for (let i = 0; i < iterations; i++) {
            imgs.forEach(img => {
                const temp = Math.ceil(Math.random() * 6);
                if (this.assets[player] && this.assets[player][temp]) {
                    img.src = this.assets[player][temp].src;
                }
            });
            await new Promise(r => setTimeout(r, speed));
        }

        imgs.forEach((img, idx) => {
            const val = values[idx];
            img.classList.remove('dice-rolling');
            if (this.assets[player] && this.assets[player][val]) {
                img.src = this.assets[player][val].src;
            }
        });

        if (valueText) {
            const total = values.length > 1 ? values.reduce((a, b) => a + b, 0) : values[0];
            const detail = values.length > 1 ? ` (${values.join(' + ')})` : ''; // Only show detail if multiple dice
            valueText.innerHTML += `<div class="panel-label" id="dice-value">${messagePrefix} ${total}${detail}</div>`;
        }
    }

    async performInitialRollsFlow() {
        this.reset();
        if (this.startPlayerModal) this.startPlayerModal.classList.add('open');
        if (this.startDiceTurnText) this.startDiceTurnText.innerText = "Determining starting player...";

        this.rolls[1] = this.roll();
        this.rolls[2] = this.roll();

        await this.#animateRoll(1, this.rolls[1], "Player 1 :", this.startDiceImgContainer, this.startDiceValueText);
        await this.#animateRoll(2, this.rolls[2], "Player 2 :", this.startDiceImgContainer, this.startDiceValueText);

        const winner = this.determineStartingPlayer();
        if (this.startDiceTurnText) this.startDiceTurnText.innerText = `Player ${winner} starts the battle!`;

        if (this.startContinueBtn) {
            this.startContinueBtn.innerText = "Start Battle";
            this.startContinueBtn.classList.remove('hidden');
            
            // Wait for user to click to dismiss the modal
            await new Promise(resolve => {
                this.startContinueBtn.onclick = () => {
                    this.startContinueBtn.classList.add('hidden');
                    resolve();
                };
            });
        }

        if (this.startPlayerModal) this.startPlayerModal.classList.remove('open');
    }

    determineStartingPlayer() {
        const p1 = this.rolls[1];
        const p2 = this.rolls[2];

        if (p1 > p2) return 1;
        if (p2 > p1) return 2;
        return Math.ceil(Math.random() * 2);
    }

    reset() {
        this.rolls = { 1: null, 2: null };
        this.playerTurn = 1;
        this.bonus = 0;

        if (this.diceRollDiv) {
            this.diceRollDiv.classList.add("hidden");
        }

        if (this.startPlayerModal) {
            this.startPlayerModal.classList.remove("open");
        }

        if (this.rollDiceButton) {
            this.rollDiceButton.disabled = false;
            this.rollDiceButton.onclick = null;
        }

        if (this.diceValueText) {
            this.diceValueText.innerHTML = "";
        }

        if (this.startDiceValueText) {
            this.startDiceValueText.innerHTML = "";
        }

        if (this.diceImgContainer) {
            this.diceImgContainer.innerHTML = "";
        }

        if (this.startDiceImgContainer) {
            this.startDiceImgContainer.innerHTML = "";
        }

        if (this.diceTurnText) {
            this.diceTurnText.innerText = "Player 1 roll";
        }

        if (this.startDiceTurnText) {
            this.startDiceTurnText.innerText = "Player 1 rolling...";
        }

        if (this.startContinueBtn) {
            this.startContinueBtn.classList.add("hidden");
            this.startContinueBtn.onclick = null;
        }
    }

    async performBonusRollFlow(player) {
        if (this.diceRollDiv) this.diceRollDiv.classList.remove('hidden');
        if (this.diceValueText) this.diceValueText.innerHTML = "";
        if (this.diceTurnText) this.diceTurnText.innerText = `Player ${player}: Rolling for Attack Bonus...`;
        if (this.rollDiceButton) this.rollDiceButton.disabled = true;

        await new Promise(r => setTimeout(r, 1000));
        this.bonus = this.roll();
        await this.#animateRoll(player, this.bonus, "Attack Bonus Gained: +", this.diceImgContainer, this.diceValueText);

        return this.bonus;
    }
}