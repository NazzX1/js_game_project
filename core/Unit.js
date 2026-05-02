export class Unit {
    constructor(type, stats, player, x, y) {
        this.type      = type;
        this.label     = stats.label;
        this.name      = stats.name;
        this.moveRange = stats.move;
        this.force     = stats.force;
        this.player    = player;   
        this.x         = x;
        this.y         = y;

        
        this.hasMoved    = false;
        this.hasActed    = false;
        this.isDefending = false;
        this.trapDebuff  = false;   
        this.alive       = true;
    }

    resetTurn() {
        this.hasMoved    = false;
        this.hasActed    = false;
        this.isDefending = false;
    }
}