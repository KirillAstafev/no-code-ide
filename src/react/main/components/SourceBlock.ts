import {CanvasBlock} from '@gravity-ui/graph';

export class SourceBlock extends CanvasBlock {
    private renderBasic(ctx: CanvasRenderingContext2D) {
        const {x, y, width, height} = this.state;
        const scale = this.context.camera.getCameraScale();

        ctx.fillStyle = '#dcfce7';
        ctx.fillRect(x, y, width, height);

        ctx.lineWidth = Math.max(1.5, Math.round(2 / scale));
        ctx.strokeStyle = '#16a34a';
        ctx.strokeRect(x, y, width, height);
    }

    public override renderMinimalisticBlock(ctx: CanvasRenderingContext2D) {
        this.renderBasic(ctx);
    }

    public override renderSchematicView(ctx: CanvasRenderingContext2D) {
        this.renderBasic(ctx);

        const {width, height, x, y} = this.state;
        const scale = this.context.camera.getCameraScale();
        if (this.shouldRenderText && scale > 0.3 && scale < .7) {
            ctx.fillStyle = '#14532d';
            ctx.font = `${Math.round(14 / scale)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText(this.state.name, x + width / 2, y + height - 12);
        }

        if (this.state.selected) {
            this.renderStroke(this.context.colors.block?.selectedBorder ?? '#ff9800');
        }
    }

    public override renderDetailedView(ctx: CanvasRenderingContext2D) {
        this.renderBasic(ctx);

        const {x, y, width, height} = this.state;
        const scale = this.context.camera.getCameraScale();

        ctx.fillStyle = '#14532d';
        ctx.textAlign = 'center';
        ctx.font = `${Math.round(15 / scale)}px sans-serif`;
        
        ctx.fillText(this.state.name, x + width / 2, y + height - 32);

        ctx.font = `${Math.round(11 / scale)}px sans-serif`;
        // @ts-ignore
        ctx.fillText(this.state.meta["ipAddress"] as string ?? '-', x + width / 2, y + height - 12);

        if (this.state.selected) {
            this.renderStroke(this.context.colors.block?.selectedBorder ?? '#ff9800');
        }
    }

    public override updatePosition(x: number, y: number) {
        super.updatePosition(x, y);
    }

    public override handleEvent(event: CustomEvent) {
        console.log(`Source block ${this.state.id} clicked`);
        super.handleEvent(event);
    }
}

export const SOURCE_BLOCK = "source";
