'use client';

import { createContext, useContext } from 'react';
import { Subscriptions, useSubscriptions } from '@/src/utils/hooks';
import type { ProgramState } from './program/types';

export const ProgramStateContext = createContext<ProgramState | null>(null);
const emptySubscriptions = new Subscriptions();

export function useProgramState(): ProgramState {
  const context = useContext(ProgramStateContext);
  useSubscriptions(context?.htmlSubs ?? emptySubscriptions);
  if (!context) {
    throw new Error(
      'useProgramState must be used inside ProgramStateContext.Provider.',
    );
  }
  return context;
}
