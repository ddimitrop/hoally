import { loadScriptOnce } from './json-utils.js';
import { useRef, useEffect, useContext } from 'react';
import { Global } from './Global.js';
import { postData } from './json-utils.js';

const GoogleSignIn = ({
  googleClientId,
  text = 'signin_with',
  personalized = true,
  onSignIn = () => {},
}) => {
  const global = useContext(Global);
  const loaded = useRef(false);

  function handleCredentialResponse(response) {
    const { credential } = response;
    postData('/api/hoauser/google-signup', { credential })
      .then(({ payload }) => {
        onSignIn(payload, credential);
      })
      .catch((error) => {
        global.setError(error.message);
      });
  }

  const initSignIn = () => {
    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: handleCredentialResponse,
    });

    window.google.accounts.id.renderButton(
      document.getElementById('googleSignInButton'),
      {
        theme: 'outline',
        size: 'large',
        text,
        width: personalized ? 200 : 195,
      },
    );
  };

  useEffect(() => {
    loadScriptOnce(
      `https://accounts.google.com/gsi/client`,
      document.querySelector('head'),
      'google-gsi',
      loaded,
      initSignIn,
    );
  });

  return <div style={{ height: '40px' }} id="googleSignInButton"></div>;
};

export default GoogleSignIn;
