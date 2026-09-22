import { camScaleToScreen } from "../Camera";
import { drawText, IFontOpts, measureText } from "../render/fontRender";
import { RenderPhase } from "../render/sharedRender";
import { Mat4f } from "@/src/utils/matrix";
import { Vec3, Vec4 } from "@/src/utils/vector";
import type { ProgramState } from "../program/types";

export function drawBlockInfo(state: ProgramState) {
    const render = state.render;
    if (!render) {
        return;
    }

    for (const blk of state.layout.cubes) {

        const blkTopMid = new Vec3(blk.x + blk.dx / 2, blk.y, blk.z + blk.dz / 2);

        let scale = camScaleToScreen(state, blkTopMid);

        scale = Math.min(scale, 1.45);
        // have a max scale

        const textColor = new Vec4(0.2, 0.29, 0.24, 1).mul(blk.opacity);

        if (blk.opacity === 0 || !blk.name || blk.label === false) {
            continue;
        }

        // draw text, centered on top of the block
        const text = blk.name;
        const mtx = Mat4f.fromTranslation(blkTopMid);
        const textOpts: IFontOpts = { color: textColor, size: scale * 2.5, mtx };
        const textW = measureText(render.modelFontBuf, text, textOpts);

        const pad = 0.4;
        render.sharedRender.activePhase = RenderPhase.Overlay;
        drawText(render.modelFontBuf, text, -textW / 2, -textOpts.size - pad, textOpts);
    }
}
