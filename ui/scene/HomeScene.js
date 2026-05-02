import { Scene }     from './Scene.js';
import { SceneType } from '../../data/Enums.js';

export class HomeScene extends Scene {
    constructor(app) {
        super();
        this.app        = app;
        this.domElement = document.getElementById('home-scene');
    }

    onEnter() {
        this.domElement.classList.remove('hidden');

        // Start button
        const btnStart = document.getElementById('start-btn');
        if (btnStart) {
            btnStart.onclick = () => {
                this.app.switchScene(SceneType.GAME);
            };
        }

        // Mode buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.app.vsAI = btn.dataset.mode === 'ai';
            };
        });

        // Settings segment buttons
        document.querySelectorAll('.seg-btn').forEach(btn => {
            btn.onclick = () => {
                const siblings = btn.parentElement.querySelectorAll('.seg-btn');
                siblings.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            };
        });

        // Settings modal
        const btnSettings = document.getElementById('settings-btn');
        const settingsContainer = document.getElementById('settings-container');
        const btnSettingsBack = document.getElementById('settings-back-btn');
        const btnSettingsConfirm = document.getElementById('settings-confirm-btn');

        
        if (btnSettings && settingsContainer) {
            btnSettings.onclick = () => {
                settingsContainer.classList.add('open');
            };
        }
        
        if (btnSettingsBack && settingsContainer) {
            btnSettingsBack.onclick = () => {
                settingsContainer.classList.remove('open');
            };
        }

        if (btnSettingsConfirm && settingsContainer) {
            btnSettingsConfirm.onclick = () => {
                settingsContainer.classList.remove('open');
            };
        }

        if (settingsContainer) {
            settingsContainer.onclick = (e) => {
                if (e.target === settingsContainer)
                    settingsContainer.classList.remove('open');
            };
        }
    }

    onExit() {
        this.domElement.classList.add('hidden');
    }

    draw(ctx) {}
}