import { SliceLines } from './types';

export interface HistoryState {
  past: SliceLines[];
  present: SliceLines;
  future: SliceLines[];
}

export const createInitialHistory = (initialState: SliceLines): HistoryState => ({
  past: [],
  present: initialState,
  future: []
});

export const addToHistory = (history: HistoryState, newState: SliceLines): HistoryState => ({
  past: [...history.past, history.present],
  present: newState,
  future: []
});

export const undo = (history: HistoryState): HistoryState | null => {
  if (history.past.length === 0) return null;

  const previous = history.past[history.past.length - 1];
  const newPast = history.past.slice(0, -1);

  return {
    past: newPast,
    present: previous,
    future: [history.present, ...history.future]
  };
};

export const redo = (history: HistoryState): HistoryState | null => {
  if (history.future.length === 0) return null;

  const next = history.future[0];
  const newFuture = history.future.slice(1);

  return {
    past: [...history.past, history.present],
    present: next,
    future: newFuture
  };
}; 