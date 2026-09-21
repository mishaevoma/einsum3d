'use client';
import {
  createOperand,
  createPythonLoopString,
  deriveEinsumState,
  type EinsumOperand,
  type EinsumState,
} from '@/src/einsum';
import EinsumInputManager from './EinsumInputManager';

export interface EinsumDemoAppProps {
  state: EinsumState;
  onStateChanged: (state: EinsumState) => void;
}

function nextOperandName(operands: EinsumOperand[]): string {
  const lastName = operands.at(-1)?.name;
  if (lastName?.length === 1) {
    return String.fromCharCode(lastName.charCodeAt(0) + 1);
  }
  return `Operand ${operands.length + 1}`;
}

export function EinsumDemoApp({
  state,
  onStateChanged,
}: EinsumDemoAppProps) {
  const update = (equation: string, operands: EinsumOperand[]) => {
    onStateChanged(deriveEinsumState(equation, operands));
  };

  const python = state.output
    ? createPythonLoopString(
        state.operands.map((operand) => operand.name),
        {
          inputDims: state.output.inputDims,
          freeDims: state.output.freeDims,
          summationDims: state.output.summationDims,
          dimSizes: state.output.dimSizes,
        },
      )
    : `raise ValueError(${JSON.stringify(state.error ?? 'Invalid equation')})`;

  return (
    <>
      <EinsumInputManager
        operands={state.operands}
        equation={state.equation}
        error={state.error}
        onEquationChange={(equation) => update(equation, state.operands)}
        onAddOperand={() =>
          update(state.equation, [
            ...state.operands,
            createOperand(nextOperandName(state.operands), [8, 32]),
          ])
        }
        onRemoveOperand={(index) =>
          update(
            state.equation,
            state.operands.filter((_, operandIndex) => operandIndex !== index),
          )
        }
        onUpdateOperand={(index, operand) =>
          update(
            state.equation,
            state.operands.map((current, operandIndex) =>
              operandIndex === index ? operand : current,
            ),
          )
        }
      />
      <pre className="mt-3 overflow-x-auto rounded bg-slate-950 p-3 text-sm text-slate-100">
        <code>{python}</code>
      </pre>
    </>
  );
}
