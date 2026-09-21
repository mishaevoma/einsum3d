'use client';

import { useState, useSyncExternalStore } from 'react';
import type { EinsumState } from '@/src/einsum';
import { EinsumDemoApp } from '@/src/app/meinsum/EinsumDemoApp';
import {
  selectPreset,
  updateCurrentEinsumState,
} from './program/EinsumProgram';
import { useProgramState } from './Sidebar';
import TableOfContents from './MeinsumMenu';
import styles from './Sidebar.module.scss';

function useIsHydrated(): boolean {
  return useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
}

export function MeinsumSidebar() {
  const program = useProgramState();
  const [, rerender] = useState(0);
  const ready = useIsHydrated();
  const preset = program.presets[program.currentPresetIndex];
  const flush = () => rerender((value) => value + 1);

  const handleStateChanged = (state: EinsumState) => {
    updateCurrentEinsumState(program, state);
    flush();
  };

  const handleEntryClick = (index: number) => {
    selectPreset(program, index);
    flush();
  };

  return (
    <aside className={styles.walkthrough} data-editor-ready={ready}>
      <div className={styles.split}>
        <div className={styles.content}>
          <TableOfContents
            texts={program.presets.map((item) => item.name)}
            selectedIndex={program.currentPresetIndex}
            onEntryClick={handleEntryClick}
          />
          <EinsumDemoApp
            state={preset.state}
            onStateChanged={handleStateChanged}
          />
        </div>
      </div>
    </aside>
  );
}
