export interface OperandCoordinate {
  operandIndex: number;
  indices: number[];
}

export type RelationTerm = OperandCoordinate[];

export class MultidimArray<T> {
  readonly shape: number[];
  private readonly strides: number[];
  private readonly values: T[];

  constructor(shape: number[], createValue: () => T) {
    this.shape = [...shape];
    this.strides = shape.map((_, index) =>
      shape.slice(index + 1).reduce((product, size) => product * size, 1),
    );
    const size = shape.reduce((product, dimension) => product * dimension, 1);
    this.values = Array.from({ length: size }, createValue);
  }

  getItem(indices: number[]): T {
    return this.values[this.flatIndex(indices)];
  }

  setItem(indices: number[], value: T): void {
    this.values[this.flatIndex(indices)] = value;
  }

  toArray(): unknown {
    const build = (dimension: number, indices: number[]): unknown => {
      if (dimension === this.shape.length) {
        return this.getItem(indices);
      }
      return Array.from({ length: this.shape[dimension] }, (_, index) =>
        build(dimension + 1, [...indices, index]),
      );
    };
    return build(0, []);
  }

  private flatIndex(indices: number[]): number {
    if (indices.length !== this.shape.length) {
      throw new RangeError(
        `Expected ${this.shape.length} indices, received ${indices.length}.`,
      );
    }
    return indices.reduce((offset, index, dimension) => {
      const size = this.shape[dimension];
      if (!Number.isInteger(index) || index < 0 || index >= size) {
        throw new RangeError(
          `Index ${index} is outside dimension ${dimension} with size ${size}.`,
        );
      }
      return offset + index * this.strides[dimension];
    }, 0);
  }
}

export interface ValidRelationMap {
  valid: true;
  relationMap: MultidimArray<RelationTerm[]>;
  inputDims: string[];
  freeDims: string[];
  summationDims: string[];
  dimSizes: Record<string, number>;
}

export interface InvalidRelationMap {
  valid: false;
  reason: string;
}

export type RelationMapResult = ValidRelationMap | InvalidRelationMap;

const MAX_RELATION_TERMS = 2_000_000;
const DIMENSION_PATTERN = /^[A-Za-z]$/;

function coordinatesForShape(shape: number[]): number[][] {
  if (shape.length === 0) {
    return [[]];
  }
  const [size, ...rest] = shape;
  const suffixes = coordinatesForShape(rest);
  return Array.from({ length: size }, (_, index) =>
    suffixes.map((suffix) => [index, ...suffix]),
  ).flat();
}

function coordinateMap(
  names: string[],
  coordinates: number[],
): Record<string, number> {
  return Object.fromEntries(
    names.map((name, index) => [name, coordinates[index]]),
  );
}

export function buildRelationMap(
  equation: string,
  shapes: number[][],
): RelationMapResult {
  const compactEquation = equation.replace(/\s+/g, '');
  const arrowParts = compactEquation.split('->');
  if (arrowParts.length > 2) {
    return { valid: false, reason: 'Equation may contain only one ->.' };
  }

  const inputSpec = arrowParts[0];
  const outputSpec = arrowParts[1] ?? '';
  const inputDims = inputSpec === '' ? [] : inputSpec.split(',');
  if (inputDims.length !== shapes.length) {
    return {
      valid: false,
      reason: 'The number of input terms must match the number of operands.',
    };
  }
  if (outputSpec.includes(',')) {
    return { valid: false, reason: 'An einsum equation has one output term.' };
  }

  const allLabels = [...inputDims.join(''), ...outputSpec];
  const invalidLabel = allLabels.find((label) => !DIMENSION_PATTERN.test(label));
  if (invalidLabel) {
    return {
      valid: false,
      reason: `Unsupported dimension label "${invalidLabel}". Use single letters.`,
    };
  }

  const freeDims = [...outputSpec];
  if (new Set(freeDims).size !== freeDims.length) {
    return {
      valid: false,
      reason: 'Repeated dimensions in the output are not allowed.',
    };
  }

  const dimSizes: Record<string, number> = {};
  for (let operandIndex = 0; operandIndex < shapes.length; operandIndex += 1) {
    const shape = shapes[operandIndex];
    const dimensions = inputDims[operandIndex];
    if (dimensions.length !== shape.length) {
      return {
        valid: false,
        reason: `Operand ${operandIndex + 1} has rank ${shape.length}, but "${dimensions}" has ${dimensions.length} dimensions.`,
      };
    }
    for (let dimensionIndex = 0; dimensionIndex < shape.length; dimensionIndex += 1) {
      const size = shape[dimensionIndex];
      const label = dimensions[dimensionIndex];
      if (!Number.isSafeInteger(size) || size <= 0) {
        return {
          valid: false,
          reason: `Dimension sizes must be positive integers; received ${size}.`,
        };
      }
      if (dimSizes[label] !== undefined && dimSizes[label] !== size) {
        return {
          valid: false,
          reason: `Dimension "${label}" has conflicting sizes ${dimSizes[label]} and ${size}.`,
        };
      }
      dimSizes[label] = size;
    }
  }

  const inputLabels = [...new Set(inputDims.join(''))];
  const missingOutputLabel = freeDims.find(
    (dimension) => !inputLabels.includes(dimension),
  );
  if (missingOutputLabel) {
    return {
      valid: false,
      reason: `Output dimension "${missingOutputLabel}" does not appear in an input.`,
    };
  }

  const summationDims = inputLabels.filter(
    (dimension) => !freeDims.includes(dimension),
  );
  const outputShape = freeDims.map((dimension) => dimSizes[dimension]);
  const summationShape = summationDims.map(
    (dimension) => dimSizes[dimension],
  );
  const outputSize = outputShape.reduce((product, size) => product * size, 1);
  const summationSize = summationShape.reduce(
    (product, size) => product * size,
    1,
  );
  if (outputSize * summationSize > MAX_RELATION_TERMS) {
    return {
      valid: false,
      reason: `This equation expands to more than ${MAX_RELATION_TERMS.toLocaleString()} terms.`,
    };
  }

  const relationMap = new MultidimArray<RelationTerm[]>(
    outputShape,
    () => [],
  );
  for (const outputCoordinates of coordinatesForShape(outputShape)) {
    const terms: RelationTerm[] = [];
    for (const summationCoordinates of coordinatesForShape(summationShape)) {
      const coordinates = coordinateMap(
        [...freeDims, ...summationDims],
        [...outputCoordinates, ...summationCoordinates],
      );
      terms.push(
        inputDims.map((dimensions, operandIndex) => ({
          operandIndex,
          indices: [...dimensions].map((dimension) => coordinates[dimension]),
        })),
      );
    }
    relationMap.setItem(outputCoordinates, terms);
  }

  return {
    valid: true,
    relationMap,
    inputDims,
    freeDims,
    summationDims,
    dimSizes,
  };
}
