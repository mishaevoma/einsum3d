import { buildRelationMap } from './relationMap';
import { parseShape } from './shape';
import type { EinsumOperand, EinsumState } from './types';

export function deriveEinsumState(
  equation: string,
  operands: EinsumOperand[],
): EinsumState {
  const invalidShape = operands
    .map((operand) => parseShape(operand.shapeText))
    .find((result) => !result.valid);
  if (invalidShape && !invalidShape.valid) {
    return {
      equation,
      operands,
      output: null,
      error: invalidShape.reason,
    };
  }

  const relation = buildRelationMap(
    equation,
    operands.map((operand) => operand.shape),
  );
  if (!relation.valid) {
    return {
      equation,
      operands,
      output: null,
      error: relation.reason,
    };
  }

  return {
    equation,
    operands,
    output: {
      name: 'Result',
      shape: [...relation.relationMap.shape],
      relationMap: relation.relationMap,
      inputDims: relation.inputDims,
      freeDims: relation.freeDims,
      summationDims: relation.summationDims,
      dimSizes: relation.dimSizes,
    },
    error: null,
  };
}
