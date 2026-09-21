import { describe, expect, it } from 'vitest';
import { createPythonLoopString } from '@/src/einsum';

describe('createPythonLoopString', () => {
  it('emits nested loops for a two-operand contraction', () => {
    expect(
      createPythonLoopString(['A', 'B', 'C', 'D'], {
        inputDims: ['ia', 'jb', 'ab', 'ij'],
        summationDims: ['a', 'b'],
        freeDims: ['i', 'j'],
        dimSizes: { i: 8, j: 16, a: 42, b: 12 },
      }),
    ).toBe(`R = zeros(shape=(8, 16))
for i in range(8):
    for j in range(16):
        total = 0
        for a in range(42):
            for b in range(12):
                total += A[i, a] * B[j, b] * C[a, b] * D[i, j]
        R[i, j] = total`);
  });

  it('emits a scalar reduction', () => {
    expect(
      createPythonLoopString(['A'], {
        inputDims: ['i'],
        summationDims: ['i'],
        freeDims: [],
        dimSizes: { i: 8 },
      }),
    ).toBe(`R = 0
total = 0
for i in range(8):
    total += A[i]
R = total`);
  });

  it('uses a trailing comma for a 1-D zeros shape', () => {
    expect(
      createPythonLoopString(['A'], {
        inputDims: ['i'],
        summationDims: [],
        freeDims: ['i'],
        dimSizes: { i: 8 },
      }),
    ).toBe(`R = zeros(shape=(8,))
for i in range(8):
    total = 0
    total += A[i]
    R[i] = total`);
  });
});
