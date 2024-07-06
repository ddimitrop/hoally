import { createContext, useState } from 'react';

export const Global = createContext();

export default function GlobalContext({ children }) {
  const [hoaUser, setHoaUser] = useState({});
  const [appError, setAppError] = useState('');
  const [needsEmailValidation, setNeedsEmailValidation] = useState(false);
  return (
    <Global.Provider
      value={{
        hoaUser,
        setHoaUser,
        appError,
        setAppError,
        needsEmailValidation,
        setNeedsEmailValidation,
      }}
    >
      {children}
    </Global.Provider>
  );
}
