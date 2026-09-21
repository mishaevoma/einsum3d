'use client';

import type { EinsumOperand } from '@/src/einsum';
import OperandItem from './OperandItem';

interface EinsumInputManagerProps {
  operands: EinsumOperand[];
  equation: string;
  error: string | null;
  onEquationChange: (equation: string) => void;
  onAddOperand: () => void;
  onRemoveOperand: (index: number) => void;
  onUpdateOperand: (index: number, operand: EinsumOperand) => void;
}

export default function EinsumInputManager({
  operands,
  equation,
  error,
  onEquationChange,
  onAddOperand,
  onRemoveOperand,
  onUpdateOperand,
}: EinsumInputManagerProps) {
  return (
    <section aria-label="Einsum inputs">
      <div className="mb-2">
        {operands.map((operand, index) => (
          <OperandItem
            key={index}
            operand={operand}
            onUpdate={(updatedOperand) =>
              onUpdateOperand(index, updatedOperand)
            }
            onRemove={() => onRemoveOperand(index)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onAddOperand}
        className="mb-3 rounded border border-blue-600 bg-blue-300 px-2 py-1 hover:bg-blue-400"
      >
        Add operand
      </button>

      <label className="block">
        <span className="mr-2">Equation:</span>
        <input
          aria-label="Einsum equation"
          aria-invalid={Boolean(error)}
          type="text"
          value={equation}
          onChange={(event) => onEquationChange(event.target.value)}
          className={`rounded border px-1 py-0.5 ${
            error ? 'border-red-600 text-red-700' : 'border-slate-400'
          }`}
        />
      </label>
      {error && (
        <p className="mt-1 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
