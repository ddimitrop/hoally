import { createContext, useState } from 'react';

export const Global = createContext();

let currentUser = {};

export default function GlobalContext({ children }) {
  const [hoaUser, setHoaUser] = useState({});
  const [appError, setAppError] = useState('');
  const [needsEmailValidation, setNeedsEmailValidation] = useState(false);
  const getCurrentUser = () => currentUser;

  function loadHoaUser(hoaUser) {
    currentUser = hoaUser;
    setHoaUser(currentUser);
    setNeedsEmailValidation(hoaUser.email_validated === false);
  }

  return (
    <Global.Provider
      value={{
        hoaUser,
        loadHoaUser,
        getCurrentUser,
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
