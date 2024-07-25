import { createContext, useState } from 'react';

export const Global = createContext();

let currentUser = {};
let requiresAuth = false;
let needsLanding = false;

export default function GlobalContext({ children }) {
  const [hoaUser, setHoaUser] = useState({});
  const [appError, setAppError] = useState('');
  const [needsEmailValidation, setNeedsEmailValidation] = useState(false);
  const getCurrentUser = () => currentUser;
  const isAuthenticated = () => !!currentUser.name;
  const getNeedsLogout = () => requiresAuth && !isAuthenticated();
  const setRequiresAuth = () => (requiresAuth = true);
  const getNeedsLanding = () => needsLanding && isAuthenticated();
  const setNeedsLanding = () => (needsLanding = true);

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
        isAuthenticated,
        getNeedsLogout,
        getNeedsLanding,
        setRequiresAuth,
        setNeedsLanding,
      }}
    >
      {children}
    </Global.Provider>
  );
}
