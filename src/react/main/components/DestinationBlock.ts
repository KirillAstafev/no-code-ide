import {CanvasBlock, type TAnchor, type TPoint} from '@gravity-ui/graph';

export class DestinationBlock extends CanvasBlock {
    public override getAnchorPosition(anchor: TAnchor): TPoint {
        const {x, y, height} = this.state;
        return {
            x: x,
            y: y + height / 2
        };
    }

    private renderBasic(ctx: CanvasRenderingContext2D) {
        const {x, y, width, height} = this.state;
        const scale = this.context.camera.getCameraScale();

        ctx.fillStyle = '#dbeafe';
        ctx.fillRect(x, y, width, height);

        ctx.lineWidth = Math.max(1.5, Math.round(2 / scale));
        ctx.strokeStyle = '#2563eb';
        ctx.strokeRect(x, y, width, height);
    }

    public override renderMinimalisticBlock(ctx: CanvasRenderingContext2D) {
        this.renderBasic(ctx);
    }

    public override renderSchematicView(ctx: CanvasRenderingContext2D) {
        this.renderBasic(ctx);

        const scale = this.context.camera.getCameraScale();
        if (this.shouldRenderText && scale > 0.3 && scale < .7) {
            ctx.fillStyle = '#1e3a8a';
            ctx.font = `${Math.round(14 / scale)}px sans-serif`;
            ctx.textAlign = 'center';
        }

        if (this.state.selected) {
            this.renderStroke(this.context.colors.block?.selectedBorder ?? '#ff9800');
        }
    }

    public override renderDetailedView(ctx: CanvasRenderingContext2D) {
        this.renderBasic(ctx);

        const {x, y, width, height} = this.state;
        const scale = this.context.camera.getCameraScale();

        ctx.fillStyle = '#1e3a8a';
        ctx.font = `${Math.round(15 / scale)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(this.state.name, x + width / 2, y + height - 32);

        ctx.font = `${Math.round(11 / scale)}px sans-serif`;
        // @ts-ignore
        ctx.fillText(this.state.meta["url"] as string ?? '-', x + width / 2, y + height - 12);

        if (this.state.selected) {
            this.renderStroke(this.context.colors.block?.selectedBorder ?? '#ff9800');
        }
    }
}

export const DESTINATION_BLOCK = "destination";
