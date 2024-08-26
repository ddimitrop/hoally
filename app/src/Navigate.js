import { Global } from './Global.js';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';

const LOGOUT_PATH = '/';

export function useMoveNext() {
  const global = useContext(Global);
  const navigate = useNavigate();

  return () => {
    const user = global.getCurrentUser();
    const isAuthenticated = global.isAuthenticated();

    if (isAuthenticated) {
      navigate(defaultLanding(user));
    } else {
      navigate(LOGOUT_PATH);
    }
  };
}

export function useLogout() {
  const navigate = useNavigate();
  return () => {
    navigate(LOGOUT_PATH);
  };
}

export function RequireAuth({ children }) {
  const global = useContext(Global);
  global.setRequiresAuth();
  return <div className="main-content">{children}</div>;
}

const defaultLanding = (user) => {
  const defaultCommunityId = user.default_community;
  return defaultCommunityId != null
    ? `/topic/${defaultCommunityId}`
    : '/community';
};

export function DefaultLanding({ children }) {
  const global = useContext(Global);
  global.setNeedsLanding();
  return children;
}

export function useDefaultLanding() {
  const global = useContext(Global);
  const navigate = useNavigate();
  return () => {
    const user = global.getCurrentUser();
    navigate(defaultLanding(user));
  };
}

export function useDefaultNavigate() {
  const global = useContext(Global);
  const navigate = useNavigate();

  return () => {
    const user = global.getCurrentUser();

    if (global.getNeedsLanding()) {
      navigate(defaultLanding(user));
    } else if (global.getNeedsLogout()) {
      navigate(LOGOUT_PATH);
    }
  };
}
