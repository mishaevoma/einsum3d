'use client';

import { useId } from 'react';
import type { EinsumOperand } from '@/src/einsum';
import { Icon } from '../Icon';
import OperandItem from './OperandItem';
import s from '@/src/llm/Sidebar.module.scss';

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
    const id = useId();
    return (
        <section aria-label="Einsum inputs" className={s.inputs}>
            <div className={s.sectionHeading}>
                <label htmlFor={`${id}-equation`}>Einsum equation</label>
                <span>EDIT & EXPLORE</span>
            </div>
            <div className={s.equationField} data-invalid={Boolean(error)}>
                <span aria-hidden="true">Σ</span>
                <input
                    id={`${id}-equation`}
                    aria-label="Einsum equation"
                    aria-invalid={Boolean(error)}
                    aria-describedby={`${id}-hint`}
                    type="text"
                    spellCheck={false}
                    autoComplete="off"
                    value={equation}
                    onChange={(event) => onEquationChange(event.target.value)}
                />
                {!error && <Icon name="check" size={16} />}
            </div>
            <p
                id={`${id}-hint`}
                className={error ? s.error : s.hint}
                role={error ? 'alert' : undefined}
            >
                {error ?? (
                    <>
                        Inputs on the left. Output after <code>→</code>.
                    </>
                )}
            </p>
            <div className={s.sectionHeading}>
                <span>Input tensors</span>
                <span>{operands.length} OPERANDS</span>
            </div>
            <div className={s.operandHeaders}>
                <span>Name</span>
                <span>Shape</span>
            </div>
            <div className={s.operands}>
                {operands.map((operand, index) => (
                    <OperandItem
                        key={index}
                        operand={operand}
                        index={index}
                        dimensions={
                            equation
                                .replace(/\s/g, '')
                                .split('->')[0]
                                .split(',')[index] ?? ''
                        }
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
                className={s.addOperand}
            >
                <Icon name="plus" size={14} />
                Add operand
            </button>
        </section>
    );
}
