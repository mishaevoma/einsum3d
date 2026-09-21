import type { MultidimArray, RelationTerm } from './relationMap';

export interface EinsumOperand {
  name: string;
  shape: number[];
  shapeText: string;
}

export interface EinsumOutput {
  name: string;
  shape: number[];
  relationMap: MultidimArray<RelationTerm[]>;
  inputDims: string[];
  freeDims: string[];
  summationDims: string[];
  dimSizes: Record<string, number>;
}

export interface EinsumState {
  equation: string;
  operands: EinsumOperand[];
  output: EinsumOutput | null;
  error: string | null;
}

export interface EinsumPreset {
  name: string;
  state: EinsumState;
}
