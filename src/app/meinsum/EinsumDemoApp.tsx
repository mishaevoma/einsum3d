'use client';
import { useState } from 'react';
import {
    createOperand,
    createPythonLoopString,
    deriveEinsumState,
    type EinsumOperand,
    type EinsumState,
} from '@/src/einsum';
import { Icon } from '../Icon';
import EinsumInputManager from './EinsumInputManager';
import s from '@/src/llm/Sidebar.module.scss';

export interface EinsumDemoAppProps {
    state: EinsumState;
    onStateChanged: (state: EinsumState) => void;
}

function nextOperandName(operands: EinsumOperand[]): string {
    return (
        [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].find(
            (name) => !operands.some((operand) => operand.name === name),
        ) ?? `Operand ${operands.length + 1}`
    );
}

export function EinsumDemoApp({ state, onStateChanged }: EinsumDemoAppProps) {
    const [codeMode, setCodeMode] = useState<'loops' | 'numpy'>('loops');
    const [copyResult, setCopyResult] = useState({ code: '', message: '' });
    const update = (equation: string, operands: EinsumOperand[]) => {
        setCopyResult({ code: '', message: '' });
        onStateChanged(deriveEinsumState(equation, operands));
    };
    // Positional array names cannot collide with single-letter loop indices
    // (for example the B operand and B batch dimension in the same example).
    const arrayNames = state.operands.map((_, index) => `operand_${index + 1}`);
    const python = state.output
        ? `from numpy import zeros\n\n# Input arrays follow the order above\n${createPythonLoopString(arrayNames, state.output)}`
        : '# Complete the equation to see its Python equivalent.';
    const compactEquation = state.equation.replace(/\s/g, '');
    // This editor treats an omitted output as a reduction to a scalar. Keep
    // that explicit because NumPy otherwise infers its own output dimensions.
    const explicitEquation = compactEquation.includes('->')
        ? compactEquation
        : `${compactEquation}->`;
    const numpy = `np.einsum(${JSON.stringify(explicitEquation)}, ${arrayNames.join(', ')})`;
    const code =
        codeMode === 'loops'
            ? python
            : `import numpy as np\n\n# Pass your input arrays in order\nR = ${numpy}`;
    const copyStatus = copyResult.code === code ? copyResult.message : '';
    const copyCode = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopyResult({ code, message: 'Copied' });
        } catch {
            setCopyResult({ code, message: 'Select the code to copy it' });
        }
    };

    return (
        <>
            <EinsumInputManager
                operands={state.operands}
                equation={state.equation}
                error={state.error}
                onEquationChange={(equation) =>
                    update(equation, state.operands)
                }
                onAddOperand={() =>
                    update(state.equation, [
                        ...state.operands,
                        createOperand(nextOperandName(state.operands), [8, 12]),
                    ])
                }
                onRemoveOperand={(index) =>
                    update(
                        state.equation,
                        state.operands.filter((_, i) => i !== index),
                    )
                }
                onUpdateOperand={(index, operand) =>
                    update(
                        state.equation,
                        state.operands.map((current, i) =>
                            i === index ? operand : current,
                        ),
                    )
                }
            />
            <section
                className={s.output}
                aria-label="Output tensor"
                aria-live="polite"
            >
                <div>
                    <span className={s.outputDot} />
                    <span>Output</span>
                    <code>
                        {state.output
                            ? state.output.shape.length
                                ? state.output.shape.join(' × ')
                                : 'scalar'
                            : '—'}
                    </code>
                </div>
                <p>
                    {state.output
                        ? `${state.output.shape.reduce((a, b) => a * b, 1).toLocaleString()} ${state.output.shape.reduce((a, b) => a * b, 1) === 1 ? 'element' : 'elements'} · ${state.output.freeDims.length ? `keeps ${state.output.freeDims.join(', ')}` : 'all dimensions reduced'}`
                        : 'Finish your equation to derive the output.'}
                </p>
            </section>
            <section className={s.codeSection} aria-label="Python equivalent">
                <div className={s.sectionHeading}>
                    <span>From notation to code</span>
                    <Icon name="code" size={15} />
                </div>
                <div className={s.codeBox}>
                    <div className={s.codeToolbar}>
                        <div className={s.codeTabs} aria-label="Python format">
                            <button
                                type="button"
                                aria-pressed={codeMode === 'loops'}
                                onClick={() => {
                                    setCodeMode('loops');
                                    setCopyResult({ code: '', message: '' });
                                }}
                            >
                                Loops
                            </button>
                            <button
                                type="button"
                                aria-pressed={codeMode === 'numpy'}
                                onClick={() => {
                                    setCodeMode('numpy');
                                    setCopyResult({ code: '', message: '' });
                                }}
                            >
                                NumPy
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={copyCode}
                            disabled={!state.output}
                            aria-label="Copy Python code"
                            title="Copy Python code"
                        >
                            <Icon
                                name={
                                    copyStatus === 'Copied' ? 'check' : 'copy'
                                }
                                size={14}
                            />
                        </button>
                    </div>
                    <pre tabIndex={0}>
                        <code>{code}</code>
                    </pre>
                </div>
                {copyStatus && (
                    <p role="status" className={s.hint}>
                        {copyStatus}
                    </p>
                )}
            </section>
        </>
    );
}
