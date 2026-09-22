import { focusDimension } from '../program/interaction';
import { Icon } from '@/src/app/Icon';
import { useProgramState } from '../Sidebar';
import { currentEinsumState } from '../program/EinsumProgram';
import s from '../LayerView.module.scss';

export function SceneHeading() {
    const program = useProgramState();
    const state = currentEinsumState(program);
    const equation = state.equation.split('->');
    return (
        <div className={s.sceneHeading}>
            <div className={s.eyebrow}>
                <span className={s.eyebrowLine} /> THE TENSOR PLAYGROUND
            </div>
            <h2>{program.presets[program.currentPresetIndex].name}</h2>
            <p>
                Edit an equation. Follow the dimensions. See the result take
                shape.
            </p>
            <div className={s.equationDisplay} aria-label="Visual equation">
                {equation[0].split(',').map((term, i) => (
                    <span key={i} className={s.equationTerm} data-color={i % 3}>
                        {term || '…'}
                    </span>
                ))}
                <Icon name="arrow" size={22} />
                <span className={s.equationResult}>
                    {equation[1] || (state.output ? 'scalar' : '…')}
                </span>
            </div>
        </div>
    );
}

export function SceneReading() {
    const program = useProgramState();
    const state = currentEinsumState(program);
    const output = state.output;
    const selected = program.display.focusDimension;
    const preview = program.previewStates[program.currentPresetIndex];
    return (
        <div className={s.reading}>
            <div className={s.legend} aria-label="Tensor colors">
                {preview.operands.map((operand, i) => (
                    <span key={i}>
                        <i data-color={i % 3} />
                        {operand.name}
                        <code>{operand.shape.join(' × ')}</code>
                    </span>
                ))}
                {preview.output && (
                    <>
                        <Icon name="arrow" size={14} />
                        <span>
                            <i data-color="result" />
                            Result
                            <code>
                                {preview.output.shape.join(' × ') || 'scalar'}
                            </code>
                        </span>
                    </>
                )}
            </div>
            <section
                className={s.readingCard}
                aria-label="Reading the equation"
            >
                <div className={s.readingIntro}>
                    <span>READ THE EQUATION</span>
                    <h3>
                        {output
                            ? output.summationDims.length
                                ? `Sum over ${output.summationDims.join(', ')}. ${output.freeDims.length ? `Keep ${output.freeDims.join(', ')}.` : 'Get a scalar.'}`
                                : 'Keep every output dimension.'
                            : 'A little work in progress.'}
                    </h3>
                </div>
                <div className={s.dimensionGuide}>
                    {output ? (
                        <>
                            <div className={s.dimensionGroups}>
                                {[
                                    {
                                        name: 'KEEP',
                                        dims: output.freeDims,
                                        kind: 'keep',
                                    },
                                    {
                                        name: 'SUM OVER',
                                        dims: output.summationDims,
                                        kind: 'sum',
                                    },
                                ].map(
                                    (group) =>
                                        group.dims.length > 0 && (
                                            <div key={group.kind}>
                                                <span>{group.name}</span>
                                                {group.dims.map((dim) => (
                                                    <button
                                                        type="button"
                                                        key={dim}
                                                        data-kind={group.kind}
                                                        aria-label={`Inspect dimension ${dim}`}
                                                        aria-pressed={
                                                            selected === dim
                                                        }
                                                        onClick={() => {
                                                            focusDimension(
                                                                program,
                                                                dim,
                                                            );
                                                        }}
                                                    >
                                                        <b>{dim}</b>
                                                        <span>
                                                            {
                                                                output.dimSizes[
                                                                    dim
                                                                ]
                                                            }
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        ),
                                )}
                            </div>
                            <p>
                                {selected && output.dimSizes[selected] ? (
                                    output.summationDims.includes(selected) ? (
                                        <>
                                            <b>{selected}</b> disappears from
                                            the output: sum its{' '}
                                            {output.dimSizes[selected]}{' '}
                                            positions for each output element.
                                        </>
                                    ) : (
                                        <>
                                            <b>{selected}</b> stays in the
                                            output, with{' '}
                                            {output.dimSizes[selected]}{' '}
                                            positions. Highlighted tensors carry
                                            this dimension.
                                        </>
                                    )
                                ) : (
                                    <>
                                        Letters after the arrow stay. The others
                                        are summed.{' '}
                                        <span>
                                            Click a dimension to explore.
                                        </span>
                                    </>
                                )}
                            </p>
                        </>
                    ) : (
                        <p>
                            Keep editing on the left. The scene holds your last
                            valid equation.
                        </p>
                    )}
                </div>
            </section>
        </div>
    );
}
