import {CanvasBlock, type TAnchor, type TPoint} from '@gravity-ui/graph';

export class ModuleBlock extends CanvasBlock {
    public override getAnchorPosition(anchor: TAnchor): TPoint {
        const {x, y, width, height} = this.state;

        if (anchor.id === 'input') {
            return {
                x: x,
                y: y + height / 2
            };
        }

        if (anchor.id === 'output') {
            return {
                x: x + width,
                y: y + height / 2
            };
        }

        return {
            x, y
        };
    }

    private renderBasic(ctx: CanvasRenderingContext2D) {
        const {x, y, width, height} = this.state;
        const scale = this.context.camera.getCameraScale();

        const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
        gradient.addColorStop(0, '#f3e8ff');
        gradient.addColorStop(1, '#e9d5ff');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, width, height);

        ctx.lineWidth = Math.max(2, Math.round(2.5 / scale));
        ctx.strokeStyle = '#7e22ce';
        ctx.strokeRect(x, y, width, height);
    }

    public override renderSchematicView(ctx: CanvasRenderingContext2D) {
        this.renderBasic(ctx);

        const {x, y, width, height} = this.state;
        const scale = this.context.camera.getCameraScale();
        if (this.shouldRenderText && scale > 0.3 && scale < 0.7) {
            ctx.fillStyle = '#4c1d95';
            ctx.font = `${Math.round(13 / scale)}px sans-serif`;
            ctx.textAlign = 'center';

            ctx.fillText(this.state.name, x + width / 2, y + height - 10);
        }

        if (this.state.selected) {
            this.renderStroke(this.context.colors.block?.selectedBorder ?? '#ff9800');
        }
    }

    public override renderDetailedView(ctx: CanvasRenderingContext2D) {
        this.renderBasic(ctx);

        const {width, height, x, y} = this.state;
        const scale = this.context.camera.getCameraScale();

        ctx.fillStyle = '#4c1d95';
        ctx.font = `${Math.round(15 / scale)}px monospace`;
        ctx.textAlign = 'center';

        ctx.fillText(this.state.name, x + width / 2, y + height - 32);

        if (this.state.selected) {
            this.renderStroke(this.context.colors.block?.selectedBorder ?? '#ff9800');
        }
    }
}

declare global {
    interface CanvasRenderingContext2D {
        roundRect(x: number, y: number, w: number, h: number, r: number): void;
    }
}

if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (
        x: number,
        y: number,
        w: number,
        h: number,
        r: number
    ) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.moveTo(x + r, y);
        this.lineTo(x + w - r, y);
        this.quadraticCurveTo(x + w, y, x + w, y + r);
        this.lineTo(x + w, y + h - r);
        this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        this.lineTo(x + r, y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - r);
        this.lineTo(x, y + r);
        this.quadraticCurveTo(x, y, x + r, y);
        return this;
    };
}

export const MODULE_BLOCK = "module";
