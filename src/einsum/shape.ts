import type { EinsumOperand } from './types';

export type ShapeParseResult =
  | { valid: true; shape: number[] }
  | { valid: false; reason: string };

export function parseShape(value: string): ShapeParseResult {
  const compact = value.replace(/[\s()[\]]/g, '');
  if (!compact) {
    return { valid: false, reason: 'Enter at least one positive dimension.' };
  }

  const parts = compact.split(',');
  const shape: number[] = [];
  for (const part of parts) {
    if (!/^\d+$/.test(part)) {
      return {
        valid: false,
        reason: `"${part}" is not a positive integer.`,
      };
    }
    const size = Number(part);
    if (!Number.isSafeInteger(size) || size <= 0) {
      return {
        valid: false,
        reason: 'Dimension sizes must be positive safe integers.',
      };
    }
    shape.push(size);
  }

  return { valid: true, shape };
}

export function createOperand(
  name: string,
  shape: number[],
): EinsumOperand {
  return {
    name,
    shape: [...shape],
    shapeText: JSON.stringify(shape),
  };
}
