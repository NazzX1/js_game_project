import { CellType, UnitType } from '../data/Enums.js';
import { createTileLibrary } from '../utils/utils.js';

const COLORS = {
    bg:          '#0d0b08',
    gridLine:    'rgba(201,168,76,0.18)',
    gridLineDark:'rgba(201,168,76,0.08)',
    empty:       '#111009',
    emptyAlt:    '#130f08',
    p1Zone:      'rgba(74,144,217,0.07)',
    p2Zone:      'rgba(213,74,74,0.07)',
    p1Own:       'rgba(74,144,217,0.22)',
    p2Own:       'rgba(213,74,74,0.22)',
    p1OwnBorder: 'rgba(74,144,217,0.5)',
    p2OwnBorder: 'rgba(213,74,74,0.5)',
    bonusAtk:    'rgba(74,173,122,0.14)',
    bonusDef:    'rgba(74,144,217,0.14)',
    trap:        'rgba(192,57,43,0.14)',
    highlight:   'rgba(201,168,76,0.3)',
    highlightBorder:'rgba(201,168,76,0.9)',
    validMove:   'rgba(74,173,122,0.22)',
    validMoveBorder:'rgba(74,173,122,0.8)',
    validAttack: 'rgba(213,74,74,0.22)',
    validAttackBorder:'rgba(213,74,74,0.8)',
    selected:    'rgba(201,168,76,0.18)',
    p1Unit:      '#7ab8f5',
    p2Unit:      '#f57a7a',
    p1UnitBg:    'rgba(74,144,217,0.35)',
    p2UnitBg:    'rgba(213,74,74,0.35)',
    gold:        '#c9a84c',
    green:       '#5bad7a',
    red:         '#c0392b',
    text:        '#f0e6cc',
    textDim:     '#9a8a68',
};


export class Renderer {
    constructor(canvasId, gridSize) {
        this.canvas   = document.getElementById(canvasId);
        this.ctx      = this.canvas.getContext('2d');
        this.gridSize = gridSize;

        this.animations    = [];   
        this.tileLibrary   = [];
        this.unitAssets    = {};
        this.pulseTime     = 0;
        this.hoveredCell   = null; 
        this.isReady       = false;

        this.loadAssets();

        this._resize();
        window.addEventListener('resize', () => this._resize());
        
        this.canvas.addEventListener('mousemove', (e) => {
            this.hoveredCell = this.getGridCoords(e);
        });
    }

    _resize() {
    const container = this.canvas.parentElement;
    const size = Math.min(container.clientWidth, container.clientHeight, 620);
    this.canvas.width = size;
    this.canvas.height = size;

    this.offsetX = 20; 
    this.offsetY = 20;

    this.cellSize = (size - (this.offsetX * 2)) / this.gridSize;
    }

    draw(gameManager) {
        this.pulseTime += 0.05;
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this._drawCells(ctx, gameManager);
    }

    _drawCells(ctx, gm) {
    if (!this.isReady) return;
    const { grid, selectedUnit } = gm;
    const cs = this.cellSize;

    for (let r = 0; r < this.gridSize; r++) {
        for (let c = 0; c < this.gridSize; c++) {
            const cell = grid.matrix[r][c];
            const px   = this.offsetX + c * cs;
            const py   = this.offsetY + r * cs;

            ctx.drawImage(this.tileLibrary[6], px, py, cs, cs);

            const typeIndex = this._getSpriteIndex(cell.type);
            if (typeIndex !== null && this.tileLibrary[typeIndex]) {
                ctx.drawImage(this.tileLibrary[typeIndex], px, py, cs, cs);
            }

            if (cell.units && cell.units.length > 0) {
                const unit = cell.units[0];
                const assetPath = gm.level.units[unit.type]?.asset;
                if (assetPath && this.unitAssets[assetPath]) {
                    const img = this.unitAssets[assetPath];
                    ctx.drawImage(img, px, py, cs, cs);
                }
            }

            this._drawCellBorder(ctx, cell, px, py, cs);

            this._drawOverlays(ctx, cell, r, c, px, py, cs, selectedUnit);
        }
    }
}

    _drawCellBorder(ctx, cell, px, py, cs) {
        ctx.strokeStyle = COLORS.gridLine;
        ctx.lineWidth = 1;

        if (cell.owner === 1) {
            ctx.strokeStyle = COLORS.p1OwnBorder;
            ctx.lineWidth = 2;
        } else if (cell.owner === 2) {
            ctx.strokeStyle = COLORS.p2OwnBorder;
            ctx.lineWidth = 2;
        }

        ctx.strokeRect(px, py, cs, cs);
    }
    _drawOverlays(ctx, cell, r, c, px, py, cs, selectedUnit) {
        const isSelected = selectedUnit && selectedUnit.x === c && selectedUnit.y === r;
        const isHovered  = this.hoveredCell && this.hoveredCell.x === c && this.hoveredCell.y === r;

        if (isHovered && !isSelected) {
            ctx.fillStyle = COLORS.highlight;
            ctx.fillRect(px, py, cs, cs);
        }

        if (isSelected) {
            ctx.strokeStyle = COLORS.highlightBorder;
            ctx.lineWidth = 2.5;
            ctx.strokeRect(px + 1, py + 1, cs - 2, cs - 2);
        }
    }

    _getSpriteIndex(type) {
        const mapping = {
            [CellType.NEUTRAL]:   0,
            [CellType.BONUS_ATK]: 1,
            [CellType.BONUS_DEF]: 2,
            [CellType.TRAP]:      3,
        };
        return mapping[type] ?? null;
    }


   

    getGridCoords(event) {
    const rect = this.canvas.getBoundingClientRect();
    
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    const mx = (event.clientX - rect.left) * scaleX;
    const my = (event.clientY - rect.top) * scaleY;

    const x = Math.floor((mx - this.offsetX) / this.cellSize);
    const y = Math.floor((my - this.offsetY) / this.cellSize);

    if (x < 0 || x >= this.gridSize || y < 0 || y >= this.gridSize) {
        return null;
    }
    return { x, y };
}


    async loadAssets() {
        if (this.isReady) return;
        try {
            const sprites = await createTileLibrary('./assets/tiles.png', 16);
            this.tileLibrary = sprites;
            this.isReady = true;
            console.log("Assets processed successfully");
        } catch (e) {
            console.error("Asset loading failed", e);
        }
    }

    async loadUnitAssets(level) {
        if (!level || !level.units) return;
        
        for (const [unitType, config] of Object.entries(level.units)) {
            if (config.asset && !this.unitAssets[config.asset]) {
                try {
                    const img = new Image();
                    img.src = config.asset;
                    await new Promise(resolve => img.onload = resolve);
                    this.unitAssets[config.asset] = img;
                } catch (e) {
                    console.error(`Failed to load unit asset: ${config.asset}`, e);
                }
            }
        }
    }
}