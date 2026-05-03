/**
 * Minimal pub/sub store — state tanpa framework; UI subscribe untuk konsistensi.
 */
export function createStore(initialState) {
  let state = structuredClone(initialState);
  const listeners = new Set();

  return {
    getState() {
      return state;
    },
    setState(partial) {
      state = { ...state, ...partial };
      listeners.forEach((fn) => {
        try {
          fn(state);
        } catch (e) {
          console.error('store subscriber error', e);
        }
      });
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}
