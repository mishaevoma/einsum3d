'use client';

import { useSyncExternalStore } from 'react';
import type { EinsumState } from '@/src/einsum';
import { EinsumDemoApp } from '@/src/app/meinsum/EinsumDemoApp';
import { Icon } from '@/src/app/Icon';
import {
    resetCurrentPreset,
    selectPreset,
    updateCurrentEinsumState,
} from './program/EinsumProgram';
import { useProgramState } from './Sidebar';
import TableOfContents from './MeinsumMenu';
import s from './Sidebar.module.scss';

function useIsHydrated(): boolean {
    return useSyncExternalStore(
        () => () => undefined,
        () => true,
        () => false,
    );
}

export function MeinsumSidebar() {
    const program = useProgramState();
    const ready = useIsHydrated();
    const preset = program.presets[program.currentPresetIndex];
    const handleStateChanged = (state: EinsumState) =>
        updateCurrentEinsumState(program, state);

    return (
        <aside
            className={s.sidebar}
            data-editor-ready={ready}
            aria-label="Equation editor"
        >
            <div className={s.sidebarTitle}>
                <span>YOUR WORKSPACE</span>
                <span className={s.live}>
                    <i />
                    Live
                </span>
            </div>
            <TableOfContents
                presets={program.presets}
                selectedIndex={program.currentPresetIndex}
                onEntryClick={(index) => selectPreset(program, index)}
            />
            <EinsumDemoApp
                state={preset.state}
                onStateChanged={handleStateChanged}
            />
            <div className={s.sidebarFooter}>
                <span>Curiosity encouraged.</span>
                <button
                    type="button"
                    onClick={() => resetCurrentPreset(program)}
                >
                    <Icon name="reset" size={13} />
                    Reset example
                </button>
            </div>
        </aside>
    );
}
