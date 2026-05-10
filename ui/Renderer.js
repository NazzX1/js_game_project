import { CellType, UnitType, GamePhase  } from '../data/Enums.js';
import { COLORS } from '../data/Colors.js';

export class Renderer {
    constructor(canvasId, gridSize) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = gridSize;

        this.animations = [];   
        this.tileLibrary = [];
        this.unitAssets = {};
        this.pulseTime = 0;
        this.hoveredCell = null; 
        this.isReady = false;
        this.attackIcon = null;

        this.loadAssets();

        this.#resize();
        window.addEventListener('resize', () => this.#resize());
        
        this.canvas.addEventListener('mousemove', (e) => {
            this.hoveredCell = this.getGridCoords(e);
        });
    }

    #resize() {
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

        this.#drawCells(ctx, gameManager);
    }

    #drawCells(ctx, gm) {
        if (!this.isReady) return;
        const { grid, selectedUnit, validMoves = [] , validAttacks = []} = gm;
        const cs = this.cellSize;

        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                const cell = grid.matrix[r][c];
                const px = this.offsetX + c * cs;
                const py = this.offsetY + r * cs;

                this.#drawCellBackground(ctx, cell, px, py, cs);
                this.#drawCellUnits(ctx, cell, gm, px, py, cs);
                this.#drawCellBorder(ctx, cell, px, py, cs);
                this.#drawOverlays(ctx, cell, r, c, px, py, cs, gm, selectedUnit, validMoves, validAttacks);
            }
        }
    }

    #drawCellBackground(ctx, cell, px, py, cs) {
        let tileIndex = 0;

        if (cell.owner === 1) {
            tileIndex = 1;
        } else if (cell.owner === 2) {
            tileIndex = 2;
        }

        ctx.drawImage(this.tileLibrary[tileIndex], px, py, cs, cs);

    }

    #drawCellUnits(ctx, cell, gm, px, py, cs) {
        if (!cell.units || cell.units.length === 0) return;

        this.#drawPrimaryUnit(ctx, cell.units[0], gm, px, py, cs);
        this.#drawUnitHealthBar(ctx, cell.units[0], px, py, cs);

        this.#drawUnitCounter(ctx, cell, px, py, cs);
    }

    #drawUnitCounter(ctx, cell, px, py, cs) {
        const count = cell.units.length;
        if (count <= 1) return;

        const radius = cs * 0.18;
        const x = px + cs - radius - 4;
        const y = py + radius + 4;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'white';
        ctx.font = `bold ${Math.round(cs * 0.24)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(count, x, y);
    }

    #drawPrimaryUnit(ctx, unit, gm, px, py, cs) {
        const assetPath = gm.level.units[unit.type]?.asset;
        if (!assetPath || !this.unitAssets[assetPath]) return;

        const img = this.unitAssets[assetPath];
        ctx.drawImage(img, px, py, cs, cs);
    }

    #drawSecondaryUnit(ctx, unit, gm, px, py, cs) {
        const assetPath = gm.level.units[unit.type]?.asset;
        if (!assetPath || !this.unitAssets[assetPath]) return;

        const img = this.unitAssets[assetPath];
        const size = cs * 0.5;
        const offset = cs - size - 4;
        ctx.drawImage(img, px + offset, py + offset, size, size);
    }

    #drawUnitHealthBar(ctx, unit, px, py, cs) {
        const barHeight = Math.max(4, Math.round(cs * 0.12));
        const healthRatio = Math.max(0, Math.min(1, unit.health / unit.maxHealth));
        const barWidth = cs - 8;
        const barX = px + 4;
        const barY = py + cs - barHeight - 4;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        ctx.fillStyle = healthRatio > 0.5 ? '#5cb85c' : healthRatio > 0.25 ? '#f0ad4e' : '#d9534f';
        ctx.fillRect(barX, barY, Math.round(barWidth * healthRatio), barHeight);

        ctx.strokeStyle = '#000000cc';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }

    #drawCellBorder(ctx, cell, px, py, cs) {
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

    #drawOverlays(ctx, cell, r, c, px, py, cs, gm, selectedUnit, validMoves = [], validAttacks = []) {
        const isSelected = selectedUnit && selectedUnit.x === c && selectedUnit.y === r;
        const isHovered  = this.hoveredCell && this.hoveredCell.x === c && this.hoveredCell.y === r;
        const isValidMove = validMoves.some(m => m.x === c && m.y === r);
        const isValidAttack = validAttacks.some(a => a.x === c && a.y === r);

        const shouldShowSpawnZone =
            gm.phase === GamePhase.PLACEMENT &&
            (gm.selectedPlacementUnit || gm.selectedUnit);

        const isSpawnCell = gm.isInSpawnZone(gm.currentPlayer, r);

        if (shouldShowSpawnZone && isSpawnCell) {
            ctx.fillStyle = COLORS.highlightCell;
            ctx.fillRect(px, py, cs, cs);

            ctx.strokeStyle = COLORS.highlightBorder;
            ctx.lineWidth = 2;
            ctx.strokeRect(px + 2, py + 2, cs - 4, cs - 4);
        }

        if (isValidMove && !isSelected) {

            const size = cs * 0.22;
            const offset = 4;

            if (gm.currentPlayer === 1) {
                ctx.strokeStyle = COLORS.p1Unit;
            }
            else {
                ctx.strokeStyle = COLORS.p2Unit; 
            }
            ctx.lineWidth = 3;
            this.#drawCornerBrackets(ctx, px, py, cs, size, offset);
        }

        if (isValidAttack && !isSelected) {

            const size = cs * 0.42;

            ctx.drawImage(
                this.attackIcon,
                px + (cs - size) / 2,
                py + (cs - size) / 2,
                size,
                size
            );
        }

        if (isHovered && !isSelected) {
            ctx.fillStyle = COLORS.highlight;
            ctx.fillRect(px, py, cs, cs);
        }

        if (isSelected) {
            ctx.strokeStyle = COLORS.red;
            ctx.lineWidth = 2.5;
            ctx.strokeRect(px + 1, py + 1, cs - 2, cs - 2);
        }
    }

    #drawCornerBrackets(ctx, px, py, cs, size, offset) {
        ctx.beginPath();
        ctx.moveTo(px + offset, py + size);
        ctx.lineTo(px + offset, py + offset);
        ctx.lineTo(px + size, py + offset);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(px + cs - size, py + offset);
        ctx.lineTo(px + cs - offset, py + offset);
        ctx.lineTo(px + cs - offset, py + size);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(px + offset, py + cs - size);
        ctx.lineTo(px + offset, py + cs - offset);
        ctx.lineTo(px + size, py + cs - offset);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(px + cs - size, py + cs - offset);
        ctx.lineTo(px + cs - offset, py + cs - offset);
        ctx.lineTo(px + cs - offset, py + cs - size);
        ctx.stroke();
    }

    #getSpriteIndex(type) {
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

        const tiles_paths = [
            './assets/Grass_Tile.png',
            './assets/Blue_Grass_Tile.png',
            './assets/Red_Grass_Tile.png'
        ];

        this.tileLibrary = await Promise.all(
            tiles_paths.map(path => {
                return new Promise(resolve => {
                    const img = new Image();
                    img.onload = () => resolve(img);
                    img.src = path;
                });
            })
        );

        this.attackIcon = new Image();
        this.attackIcon.src = 'assets/Black_Sword.png';

        this.isReady = true;
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
