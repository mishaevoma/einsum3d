import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
    createOperand,
    deriveEinsumState,
    type EinsumState,
} from '@/src/einsum';
import { EinsumDemoApp } from '@/src/app/meinsum/EinsumDemoApp';
import OperandItem from '@/src/app/meinsum/OperandItem';

function EditorHarness({ initial }: { initial: EinsumState }) {
    const [state, setState] = useState(initial);
    return <EinsumDemoApp state={state} onStateChanged={setState} />;
}

describe('OperandItem', () => {
    it('marks an invalid shape', async () => {
        const user = userEvent.setup();
        const onUpdate = vi.fn();
        render(
            <OperandItem
                operand={createOperand('A', [2, 3])}
                onUpdate={onUpdate}
                onRemove={() => undefined}
            />,
        );

        await user.clear(screen.getByLabelText('Operand shape'));
        await user.type(screen.getByLabelText('Operand shape'), '2,a');
        expect(onUpdate).toHaveBeenCalled();
        const lastCall = onUpdate.mock.calls.at(-1)?.[0];
        expect(lastCall?.shapeText).toContain('a');
        expect(lastCall?.shape).toEqual([2, 3]);
    });
});

describe('EinsumDemoApp', () => {
    it('keeps generated array names separate from batch indices and preserves implicit scalar reductions', async () => {
        const user = userEvent.setup();
        render(
            <EinsumDemoApp
                state={deriveEinsumState('Bi,Bi', [
                    createOperand('A', [2, 3]),
                    createOperand('B', [2, 3]),
                ])}
                onStateChanged={() => undefined}
            />,
        );
        const loops = screen.getByText(/for B in range/);
        expect(loops).toHaveTextContent('operand_2[B, i]');
        expect(loops).toHaveTextContent('from numpy import zeros');
        await user.click(screen.getByRole('button', { name: 'NumPy' }));
        expect(screen.getByText(/np.einsum/)).toHaveTextContent(
            'np.einsum("Bi,Bi->", operand_1, operand_2)',
        );
    });
    it('copies the selected Python format and reports clipboard failures', async () => {
        const user = userEvent.setup();
        render(
            <EinsumDemoApp
                state={deriveEinsumState('i,i->', [
                    createOperand('A', [3]),
                    createOperand('B', [3]),
                ])}
                onStateChanged={() => undefined}
            />,
        );
        await user.click(screen.getByRole('button', { name: 'NumPy' }));
        await user.click(
            screen.getByRole('button', { name: 'Copy Python code' }),
        );
        expect(await navigator.clipboard.readText()).toContain(
            'np.einsum("i,i->", operand_1, operand_2)',
        );
        expect(screen.getByRole('status')).toHaveTextContent('Copied');
        await user.click(screen.getByRole('button', { name: 'Loops' }));
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
        vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValueOnce(
            new Error('Clipboard unavailable'),
        );
        await user.click(
            screen.getByRole('button', { name: 'Copy Python code' }),
        );
        expect(screen.getByRole('status')).toHaveTextContent(
            'Select the code to copy it',
        );
    });
    it('renders python for a valid equation', () => {
        render(
            <EinsumDemoApp
                state={deriveEinsumState('i,i->', [
                    createOperand('A', [3]),
                    createOperand('B', [3]),
                ])}
                onStateChanged={() => undefined}
            />,
        );
        expect(screen.getByText(/for i in range\(3\):/)).toBeInTheDocument();
    });

    it('surfaces an invalid equation', () => {
        render(
            <EinsumDemoApp
                state={deriveEinsumState('i,j->k', [
                    createOperand('A', [2]),
                    createOperand('B', [3]),
                ])}
                onStateChanged={() => undefined}
            />,
        );
        expect(screen.getByRole('alert')).toHaveTextContent(
            'Output dimension "k" does not appear in an input.',
        );
        expect(screen.getByLabelText('Einsum equation')).toHaveAttribute(
            'aria-invalid',
            'true',
        );
    });

    it('updates the equation from the editor', async () => {
        const user = userEvent.setup();
        render(
            <EditorHarness
                initial={deriveEinsumState('i,i->', [
                    createOperand('A', [3]),
                    createOperand('B', [3]),
                ])}
            />,
        );

        const equation = screen.getByLabelText('Einsum equation');
        await user.clear(equation);
        await user.type(equation, 'i,j->k');
        expect(equation).toHaveValue('i,j->k');
        expect(screen.getByRole('alert')).toBeInTheDocument();

        await user.clear(equation);
        await user.type(equation, 'i,i->');
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
});
