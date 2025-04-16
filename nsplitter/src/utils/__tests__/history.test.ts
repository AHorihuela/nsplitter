import { createInitialHistory, addToHistory, undo, redo } from '../history';
import { SliceLines } from '../types';

describe('history management', () => {
  const initialState: SliceLines = {
    horizontal: [],
    vertical: []
  };

  const state1: SliceLines = {
    horizontal: [25],
    vertical: []
  };

  const state2: SliceLines = {
    horizontal: [25],
    vertical: [{ x: 30, upperBound: 0, lowerBound: 25 }]
  };

  test('creates initial history', () => {
    const history = createInitialHistory(initialState);
    expect(history).toEqual({
      past: [],
      present: initialState,
      future: []
    });
  });

  test('adds state to history', () => {
    const history = createInitialHistory(initialState);
    const newHistory = addToHistory(history, state1);
    expect(newHistory).toEqual({
      past: [initialState],
      present: state1,
      future: []
    });
  });

  test('clears future when adding new state', () => {
    const history = {
      past: [initialState],
      present: state1,
      future: [state2]
    };
    const state3 = { horizontal: [25, 75], vertical: [] };
    const newHistory = addToHistory(history, state3);
    expect(newHistory).toEqual({
      past: [initialState, state1],
      present: state3,
      future: []
    });
  });

  test('undoes last action', () => {
    const history = {
      past: [initialState, state1],
      present: state2,
      future: []
    };
    const newHistory = undo(history);
    expect(newHistory).toEqual({
      past: [initialState],
      present: state1,
      future: [state2]
    });
  });

  test('returns null when no actions to undo', () => {
    const history = {
      past: [],
      present: initialState,
      future: []
    };
    const newHistory = undo(history);
    expect(newHistory).toBeNull();
  });

  test('redoes last undone action', () => {
    const history = {
      past: [initialState],
      present: state1,
      future: [state2]
    };
    const newHistory = redo(history);
    expect(newHistory).toEqual({
      past: [initialState, state1],
      present: state2,
      future: []
    });
  });

  test('returns null when no actions to redo', () => {
    const history = {
      past: [initialState],
      present: state1,
      future: []
    };
    const newHistory = redo(history);
    expect(newHistory).toBeNull();
  });
}); 