import { Scene }      from './Scene.js';
import { SceneType, GamePhase, UnitType, ActionType } from '../../data/Enums.js';
import { GameManager } from '../../core/GameManager.js';
import { Renderer }    from '../Renderer.js';


const UNIT_TYPES_ORDER = [UnitType.TANK, UnitType.SOLDIER, UnitType.SOLDIER, UnitType.RIDER, UnitType.SOLDIER];


export class GameScene extends Scene {
    
    constructor(app) {
        super();
        this.app      = app;
        this.logic    = null;      
        this.renderer = null;      
        this.vsAI     = true;      

        
    }

   
    onEnter() {
        document.getElementById('game-scene').classList.remove('hidden');

        
        this.logic    = new GameManager(1);
        this.renderer = new Renderer('game-canvas', this.logic.config.gridSize);
        this.vsAI     = this.app.vsAI !== false;
        

        
    }

    onExit() {
        document.getElementById('game-scene').classList.add('hidden');
        if (this.renderer) {
            this.renderer.canvas.onclick = null;
        }
    }

    
    

    
    

    update() {
    }

    draw(ctx) {
        if (this.renderer && this.logic) {
            this.renderer.draw(this.logic);
        }
    }
}