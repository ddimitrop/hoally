import { createContext } from 'react';

// The global state instance that components can use to expose global states
// to the whole app.
export const global = {
  setters: {},
  get: (name) => global[name],
  set: (name, value) => global.setters[name](value),
  addState: (state, name) => {
    const [value, setter] = state;
    global[name] = value;
    global.setters[name] = setter;
    global[`set${name[0].toUpperCase() + name.slice(1)}`] = setter;
  },
};
export const Global = createContext(global);
