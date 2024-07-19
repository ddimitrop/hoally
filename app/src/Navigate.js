import { Global } from './Global.js';
import { useNavigate, Navigate } from 'react-router-dom';
import { useContext } from 'react';

export function useMoveNext() {
  const global = useContext(Global);
  const navigate = useNavigate();

  return () => {
    const user = global.getCurrentUser();
    const isAuthenticated = !!user.name;

    if (isAuthenticated) {
      navigate(defaultLanding(user));
    } else {
      navigate('/');
    }
  };
}

export function useLogout() {
  const navigate = useNavigate();
  return () => {
    navigate('/');
  };
}

export function RequireAuth({ children }) {
  const global = useContext(Global);
  const isAuthenticated = !!global.getCurrentUser().name;
  return isAuthenticated ? children : <Navigate to="/" />;
}

const defaultLanding = (user) => {
  return '/community';
};

export function DefaultLanding({ children }) {
  const global = useContext(Global);
  const user = global.getCurrentUser();
  const isAuthenticated = !!user.name;
  return isAuthenticated ? <Navigate to={defaultLanding(user)} /> : children;
}

export function useDefaultLanding() {
  const global = useContext(Global);
  const navigate = useNavigate();
  return () => {
    const user = global.getCurrentUser();
    navigate(defaultLanding(user));
  };
}
