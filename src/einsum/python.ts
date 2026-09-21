import type { ValidRelationMap } from './relationMap';

function pythonIdentifier(value: string, index: number): string {
  const normalized = value
    .trim()
    .replace(/\W+/g, '_')
    .replace(/^(\d)/, '_$1');
  return normalized || `operand_${index + 1}`;
}

function indexed(name: string, dimensions: string[]): string {
  return dimensions.length === 0
    ? name
    : `${name}[${dimensions.join(', ')}]`;
}

export function createPythonLoopString(
  operandNames: string[],
  relation: Pick<
    ValidRelationMap,
    'inputDims' | 'freeDims' | 'summationDims' | 'dimSizes'
  >,
): string {
  const { inputDims, freeDims, summationDims, dimSizes } = relation;
  const lines: string[] = [];

  if (freeDims.length === 0) {
    lines.push('R = 0');
  } else {
    const sizes = freeDims.map((dimension) => dimSizes[dimension]);
    const tuple = sizes.length === 1 ? `${sizes[0]},` : sizes.join(', ');
    lines.push(`R = zeros(shape=(${tuple}))`);
  }

  let indent = '';
  for (const dimension of freeDims) {
    lines.push(`${indent}for ${dimension} in range(${dimSizes[dimension]}):`);
    indent += '    ';
  }

  lines.push(`${indent}total = 0`);
  let summationIndent = indent;
  for (const dimension of summationDims) {
    lines.push(
      `${summationIndent}for ${dimension} in range(${dimSizes[dimension]}):`,
    );
    summationIndent += '    ';
  }

  const expression = inputDims
    .map((dimensions, index) =>
      indexed(
        pythonIdentifier(operandNames[index] ?? '', index),
        [...dimensions],
      ),
    )
    .join(' * ');
  lines.push(`${summationIndent}total += ${expression || '1'}`);
  lines.push(`${indent}${indexed('R', freeDims)} = total`);
  return lines.join('\n');
}
