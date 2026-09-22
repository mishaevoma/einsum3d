import type { EinsumState } from '@/src/einsum';
import { Vec3 } from '@/src/utils/vector';
import type { BlockKind, EinsumLayout, TensorBlock } from './layout/types';

interface CubeGeometry {
    position: Vec3;
    columns: number;
    rows: number;
}

interface Bounds {
    min: Vec3;
    max: Vec3;
}

interface TensorGeometry {
    cubes: CubeGeometry[];
    bounds: Bounds;
}

const CELL_SIZE = 1.5;
const OPERAND_MARGIN = 10;

function baseTensor(shape: number[], start: Vec3): TensorGeometry {
    const rows = shape.length === 0 ? 1 : (shape.at(-2) ?? 1);
    const columns = shape.at(-1) ?? 1;
    const max = start.add(
        new Vec3(columns * CELL_SIZE, rows * CELL_SIZE, CELL_SIZE),
    );
    return {
        cubes: [{ position: start, columns, rows }],
        bounds: { min: start, max },
    };
}

function unionBounds(left: Bounds | null, right: Bounds): Bounds {
    if (!left) {
        return {
            min: right.min.clone(),
            max: right.max.clone(),
        };
    }
    return {
        min: new Vec3(
            Math.min(left.min.x, right.min.x),
            Math.min(left.min.y, right.min.y),
            Math.min(left.min.z, right.min.z),
        ),
        max: new Vec3(
            Math.max(left.max.x, right.max.x),
            Math.max(left.max.y, right.max.y),
            Math.max(left.max.z, right.max.z),
        ),
    };
}

export function generateTensorGeometry(
    shape: number[],
    start = new Vec3(),
): TensorGeometry {
    if (shape.length <= 2) {
        return baseTensor(shape, start);
    }

    const [outerSize, ...innerShape] = shape;
    const paddingLevel = Math.ceil(shape.length / 3) - 1;
    const padding = 3 * 3 ** paddingLevel;
    const axis = shape.length % 3;
    const cubes: CubeGeometry[] = [];
    let bounds: Bounds | null = null;
    let cursor = start.clone();

    for (let index = 0; index < outerSize; index += 1) {
        const child = generateTensorGeometry(innerShape, cursor);
        cubes.push(...child.cubes);
        bounds = unionBounds(bounds, child.bounds);

        if (axis === 2) {
            cursor = new Vec3(child.bounds.max.x + padding, start.y, start.z);
        } else if (axis === 1) {
            cursor = new Vec3(start.x, child.bounds.max.y + padding, start.z);
        } else {
            cursor = new Vec3(start.x, start.y, child.bounds.max.z + padding);
        }
    }

    return {
        cubes,
        bounds: bounds ?? baseTensor([], start).bounds,
    };
}

function createBlocks(
    name: string,
    shape: number[],
    kind: BlockKind,
    start: Vec3,
): { blocks: TensorBlock[]; bounds: Bounds } {
    const geometry = generateTensorGeometry(shape, start);
    const blocks = geometry.cubes.map<TensorBlock>((cube) => ({
        idx: -1,
        kind,
        name,
        x: cube.position.x,
        y: cube.position.y,
        z: cube.position.z,
        dx: cube.columns * CELL_SIZE,
        dy: cube.rows * CELL_SIZE,
        dz: CELL_SIZE,
        cx: cube.columns,
        cy: cube.rows,
        cz: 1,
        opacity: 1,
        highlight: 0,
        small: false,
    }));
    return { blocks, bounds: geometry.bounds };
}

export function generateEinsumLayout(state: EinsumState): EinsumLayout {
    const tensors = [
        ...state.operands.map((operand) => ({
            name: operand.name,
            shape: operand.shape,
            kind: 'operand' as const,
        })),
        ...(state.output
            ? [
                  {
                      name: state.output.name,
                      shape: state.output.shape,
                      kind: 'result' as const,
                  },
              ]
            : []),
    ];

    const cubes: TensorBlock[] = [];
    let cursor = new Vec3();
    let maxHeight = 0;

    const blockCount = tensors.reduce(
        (total, tensor) =>
            total +
            tensor.shape.slice(0, -2).reduce((count, size) => count * size, 1),
        0,
    );
    if (
        blockCount > 2048 ||
        tensors.some((tensor) =>
            tensor.shape.some(
                (size) => !Number.isSafeInteger(size) || size <= 0,
            ),
        )
    ) {
        return {
            cubes: [],
            cell: CELL_SIZE,
            margin: OPERAND_MARGIN,
            height: 0,
            notice: 'This shape is too large for the 3D preview. Try smaller batch dimensions (up to 2,048 matrix slices).',
        };
    }

    for (const [tensorIndex, tensor] of tensors.entries()) {
        const { blocks, bounds } = createBlocks(
            tensor.name,
            tensor.shape,
            tensor.kind,
            cursor,
        );
        blocks.forEach((block, index) => {
            block.tensorIndex = tensorIndex;
            block.label = index === 0;
        });
        cubes.push(...blocks);
        cursor = new Vec3(bounds.max.x + OPERAND_MARGIN, 0, 0);
        maxHeight = Math.max(maxHeight, bounds.max.y - bounds.min.y);
    }

    cubes.forEach((cube, index) => {
        cube.idx = index;
    });

    return {
        cubes,
        cell: CELL_SIZE,
        margin: OPERAND_MARGIN,
        height: maxHeight,
    };
}
