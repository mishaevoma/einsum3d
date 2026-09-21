import { buildRelationMap, type RelationTerm } from './relationMap';

export type NestedNumbers = number | NestedNumbers[];

export type EvaluateResult =
  | { valid: true; value: NestedNumbers }
  | { valid: false; reason: string };

function shapeOf(value: NestedNumbers): number[] {
  const shape: number[] = [];
  let current = value;
  while (Array.isArray(current)) {
    shape.push(current.length);
    current = current[0] ?? 0;
  }
  return shape;
}

function getNested(value: NestedNumbers, indices: number[]): number {
  let current = value;
  for (const index of indices) {
    if (!Array.isArray(current)) {
      throw new RangeError('Operand has fewer dimensions than the index.');
    }
    current = current[index];
  }
  if (typeof current !== 'number') {
    throw new RangeError('Operand has more dimensions than the index.');
  }
  return current;
}

function emptyArray(shape: number[]): NestedNumbers[] {
  const build = (dimension: number): NestedNumbers[] =>
    Array.from({ length: shape[dimension] }, () =>
      dimension === shape.length - 1 ? 0 : build(dimension + 1),
    );
  return build(0);
}

function setNested(
  target: NestedNumbers[],
  indices: number[],
  value: number,
): void {
  let current: NestedNumbers = target;
  for (const index of indices.slice(0, -1)) {
    if (!Array.isArray(current)) {
      throw new RangeError('Cannot write into a scalar.');
    }
    current = current[index];
  }
  if (!Array.isArray(current)) {
    throw new RangeError('Cannot write into a scalar.');
  }
  current[indices[indices.length - 1]] = value;
}

function forEachIndex(
  shape: number[],
  visit: (indices: number[]) => void,
  prefix: number[] = [],
): void {
  if (prefix.length === shape.length) {
    visit(prefix);
    return;
  }
  for (let index = 0; index < shape[prefix.length]; index += 1) {
    forEachIndex(shape, visit, [...prefix, index]);
  }
}

function product(term: RelationTerm, operands: NestedNumbers[]): number {
  return term.reduce(
    (value, coordinate) =>
      value * getNested(operands[coordinate.operandIndex], coordinate.indices),
    1,
  );
}

function reduceTerms(terms: RelationTerm[], operands: NestedNumbers[]): number {
  return terms.reduce((sum, term) => sum + product(term, operands), 0);
}

export function evaluateEinsum(
  equation: string,
  operands: NestedNumbers[],
): EvaluateResult {
  const relation = buildRelationMap(equation, operands.map(shapeOf));
  if (!relation.valid) {
    return relation;
  }

  const { relationMap } = relation;
  if (relationMap.shape.length === 0) {
    return {
      valid: true,
      value: reduceTerms(relationMap.getItem([]), operands),
    };
  }

  const result = emptyArray(relationMap.shape);
  forEachIndex(relationMap.shape, (indices) => {
    setNested(result, indices, reduceTerms(relationMap.getItem(indices), operands));
  });
  return { valid: true, value: result };
}
