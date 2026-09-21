'use client';

import { useId } from 'react';
import type { EinsumOperand } from '@/src/einsum';
import { parseShape } from '@/src/einsum';

interface OperandItemProps {
  operand: EinsumOperand;
  onUpdate: (operand: EinsumOperand) => void;
  onRemove: () => void;
}

const inputClassName =
  'mx-1 w-28 rounded-sm border border-blue-600 px-1 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-300';

export default function OperandItem({
  operand,
  onUpdate,
  onRemove,
}: OperandItemProps) {
  const fieldId = useId();
  const parsedShape = parseShape(operand.shapeText);

  return (
    <div className="flex items-center py-0.5">
      <label className="sr-only" htmlFor={`${fieldId}-name`}>
        Operand name
      </label>
      <input
        id={`${fieldId}-name`}
        type="text"
        value={operand.name}
        onChange={(event) =>
          onUpdate({ ...operand, name: event.target.value })
        }
        placeholder="Name"
        className={inputClassName}
      />
      <label className="sr-only" htmlFor={`${fieldId}-shape`}>
        Operand shape
      </label>
      <input
        id={`${fieldId}-shape`}
        type="text"
        value={operand.shapeText}
        aria-invalid={!parsedShape.valid}
        title={parsedShape.valid ? 'Shape' : parsedShape.reason}
        onChange={(event) => {
          const shapeText = event.target.value;
          const parsed = parseShape(shapeText);
          onUpdate({
            ...operand,
            shapeText,
            shape: parsed.valid ? parsed.shape : operand.shape,
          });
        }}
        placeholder="Shape (for example 2,3)"
        className={`${inputClassName} ${
          parsedShape.valid ? '' : 'border-red-600 text-red-700'
        }`}
      />
      <button
        type="button"
        onClick={onRemove}
        className="ml-1 rounded px-1 hover:bg-red-100"
        aria-label={`Remove ${operand.name || 'operand'}`}
      >
        ×
      </button>
    </div>
  );
}
