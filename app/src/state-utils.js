import { useState, useRef, useEffect } from 'react';

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

export function formCapture(selector = 'input') {
  const values = {};
  return {
    provide: (node, name) => {
      values[name] = () => node.querySelector(selector).value;
    },
    get: (name) => values[name]?.(),
  };
}

export function formData(event) {
  return getFormData(event.currentTarget);
}

export function getFormData(elemenet) {
  const formData = new FormData(elemenet);
  return Object.fromEntries(formData.entries());
}

export function hasModifications(currentData, newData) {
  for (let v in newData) {
    if (newData[v] !== (currentData[v] || '')) return true;
  }
  return false;
}

export function usePrevious(value, init) {
  const ref = useRef(init);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

export function useValidation(invalidText) {
  let [valid, setValid] = useState(true);

  function validate(input) {
    setValid(!input || !input.value || input.checkValidity());
  }

  return {
    validate,
    isValid: () => valid,
    invalidMessage: () => (!valid ? invalidText : ''),
  };
}
