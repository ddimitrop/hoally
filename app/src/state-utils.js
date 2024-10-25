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

/** A simple wrapper for showing a "cancel" dialogs when changes would be lost. */
export function changeProtect(state, confirmState, activeState, dialog) {
  const [hasChanged, setChanged] = state;
  const [confirm, setConfirm] = confirmState;
  const [active, setActive] = activeState;
  return {
    hasChanged: () => hasChanged,
    setChanged: (value) => setChanged(value),
    wasChanged: () => setChanged(true),
    onConfirm: () => confirm?.callback?.(),
    checkChange: (callback, activeCallback) => {
      const oldActive = active?.callback;
      setActive({ callback: activeCallback });
      const doConfirm = () => {
        setChanged(false);
        setConfirm();
        dialog.close();
        oldActive?.();
        callback();
      };
      if (hasChanged) {
        setConfirm({ callback: doConfirm });
        dialog.open();
      } else {
        doConfirm();
      }
    },
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
    const newVal = newData[v];
    let currentVal = currentData[v];
    if (Array.isArray(newVal)) {
      currentVal = currentVal || [];
      if (newVal.join('|') !== currentVal.join('|')) return true;
    } else {
      currentVal = currentVal || '';
      if (newVal !== currentVal) return true;
    }
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

export function useStepper(initial) {
  let [step, setStep] = useState(initial);
  return {
    next: () => {
      setStep(step + 1);
    },
    prev: () => {
      setStep(step - 1);
    },
    current: () => step,
  };
}
