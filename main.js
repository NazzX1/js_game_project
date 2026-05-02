import { GameScene }    from './ui/scene/GameScene.js';
import { HomeScene }    from './ui/scene/HomeScene.js';
import { SceneType }    from './data/Enums.js';

class App {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx    = this.canvas.getContext('2d');
        this.vsAI   = true;  

        this.scenes = {
            [SceneType.HOME]:    new HomeScene(this),
            [SceneType.GAME]:    new GameScene(this),
        };

        this.currentScene = null;
        this.switchScene(SceneType.HOME);
        this.#loop();
    }

    switchScene(type) {
        if (this.currentScene) {
            this.currentScene.domElement?.classList.add('fade-out');
            setTimeout(() => {
                this.currentScene.onExit();
                this.currentScene = this.scenes[type];
                this.currentScene.onEnter();
            }, 250);
        } else {
            this.currentScene = this.scenes[type];
            this.currentScene.onEnter();
        }
    }

    #loop() {
        if (this.currentScene) {
            this.currentScene.update();
            this.currentScene.draw(this.ctx);
        }
        requestAnimationFrame(() => this.#loop());
    }
}

new App();