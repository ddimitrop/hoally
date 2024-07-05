/** A simple wrapper that can be used to pass state between components. */
export function flagState(state) {
  const [open, setOpen] = state;
  return {
    isOpen: () => open,
    open: () => setOpen(true),
    close: () => setOpen(false),
  };
}

/** A simple wrapper for a value. */
export function valueState(state) {
  const [value, setValue] = state;
  return {
    get: () => value,
    set: (newValue) => setValue(newValue),
  };
}
