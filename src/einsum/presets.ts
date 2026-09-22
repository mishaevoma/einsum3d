import { createOperand } from './shape';
import { deriveEinsumState } from './state';
import type { EinsumPreset } from './types';

function preset(
  name: string,
  equation: string,
  operands: Array<[name: string, shape: number[]]>,
): EinsumPreset {
  return {
    name,
    state: deriveEinsumState(
      equation,
      operands.map(([operandName, shape]) =>
        createOperand(operandName, shape),
      ),
    ),
  };
}

export function createPresets(): EinsumPreset[] {
  return [
    preset(
      'Multihead query-key attention scores',
      'Bnqh,Bnkh->Bnqk',
      [
        ['Q', [2, 4, 4, 8]],
        ['K', [2, 4, 12, 8]],
      ],
    ),
    preset('Quadratic form', 'a,ab,b->', [
      ['x', [7]],
      ['Symmetric Q', [7, 7]],
      ['x', [7]],
    ]),
    preset('Dot product', 'i,i->', [
      ['A', [16]],
      ['B', [16]],
    ]),
    preset('Transposed outer product', 'i,j->ji', [
      ['A', [7]],
      ['B', [22]],
    ]),
    preset('Matrix multiplication', 'ik,kj->ij', [
      ['A', [16, 8]],
      ['B', [8, 12]],
    ]),
    preset('Return a diagonal', 'ii->i', [['A', [16, 16]]]),
    preset('Batched matrix multiplication', 'Bik,Bkj->Bij', [
      ['A', [4, 16, 8]],
      ['B', [4, 8, 12]],
    ]),
    preset('Custom', 'abcdefg,h->he', [
      ['A', [2, 2, 2, 2, 2, 3, 3]],
      ['B', [8]],
    ]),
  ];
}
