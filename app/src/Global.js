import { createContext, useState } from 'react';

export const Global = createContext();

let currentUser = {};
let requiresAuth = false;
let needsLanding = false;

export default function GlobalContext({ children }) {
  const [hoaUser, setHoaUser] = useState({});
  const [appError, setAppError] = useState('');
  const onClose = () => {
    setAppError('');
  };
  const [appErrorClose, setAppErrorClose] = useState({ onClose });
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

  function customErrorClose(cb) {
    setAppErrorClose({
      onClose: () => {
        cb();
        setAppError('');
        setAppErrorClose({ onClose });
      },
    });
  }

  return (
    <Global.Provider
      value={{
        hoaUser,
        loadHoaUser,
        getCurrentUser,
        appError,
        setAppError,
        appErrorClose,
        customErrorClose,
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
