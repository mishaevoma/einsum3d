'use client';

import { useId } from 'react';
import type { EinsumOperand } from '@/src/einsum';
import { parseShape } from '@/src/einsum';
import { Icon } from '../Icon';
import s from '@/src/llm/Sidebar.module.scss';

interface OperandItemProps {
    operand: EinsumOperand;
    index?: number;
    dimensions?: string;
    onUpdate: (operand: EinsumOperand) => void;
    onRemove: () => void;
}

export default function OperandItem({
    operand,
    index = 0,
    dimensions = '',
    onUpdate,
    onRemove,
}: OperandItemProps) {
    const fieldId = useId();
    const parsedShape = parseShape(operand.shapeText);
    return (
        <div className={s.operand}>
            <div className={s.operandFields}>
                <span className={s.operandDot} data-color={index % 3} />
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
                    placeholder="e.g. 2,3"
                    spellCheck={false}
                />
                <button
                    type="button"
                    onClick={onRemove}
                    aria-label={`Remove ${operand.name || 'operand'}`}
                >
                    <Icon name="close" size={13} />
                </button>
            </div>
            {parsedShape.valid &&
                dimensions.length === operand.shape.length && (
                    <div className={s.operandDimensions}>
                        {[...dimensions].map((dim, i) => (
                            <span key={i}>
                                <b>{dim}</b> {operand.shape[i]}
                            </span>
                        ))}
                    </div>
                )}
        </div>
    );
}
