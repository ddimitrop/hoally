import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { useState, useContext, Fragment } from 'react';
import { Global } from './Global.js';
import { postData } from './json-utils.js';
import { formData } from './state-utils.js';
import { LOGIN_ERROR } from './errors.mjs';
import RecoveryDialog from './RecoveryDialog.js';
import { useDefaultLanding } from './Navigate.js';
import GoogleSignIn from './GoogleSignIn.js';
import { isFieldUsed } from './SignupDialog';

const SinginDialog = ({ control, skipRedirect, signupInstead }) => {
  const global = useContext(Global);
  const defaultLanding = useDefaultLanding();
  let [errorMessage, setErrorMessage] = useState('');
  let [showRecoverButton, setShowRecoverButton] = useState(false);
  let [showRecoverDialog, setShowRecoverDialog] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [payload, setPayload] = useState({});
  const [emailUsed, setEmailUsed] = useState(false);
  const [credential, setCredential] = useState('');

  function close() {
    setErrorMessage('');
    setShowRecoverButton(false);
    setShowRecoverDialog(false);
    setEmail('');
    setPassword('');
    setPayload({});
    setEmailUsed(false);
    setCredential('');
    control.close();
  }

  const recoveryControl = {
    isOpen: () => showRecoverDialog && control.isOpen(),
    close,
  };

  function exceptionMessage(e) {
    setErrorMessage(`There was a problem: "${e.message}".`);
  }

  function clearEmailError() {
    setErrorMessage('');
    setEmailUsed(false);
    setCredential('');
    setPayload({});
  }

  function signIn(data) {
    postData('/api/hoauser/signin', data)
      .then(({ hoaUser, appError }) => {
        if (hoaUser) {
          global.loadHoaUser(hoaUser);
          if (!skipRedirect) {
            defaultLanding();
          }
          close();
        } else {
          setErrorMessage(appError);
          isFieldUsed('email', data.email).then((used) => {
            setEmailUsed(used);
            setShowRecoverButton(appError === LOGIN_ERROR);
          });
        }
      })
      .catch((e) => {
        exceptionMessage(e);
      });
  }

  function triggerRecoverDialog() {
    if (payload.emailVerified) {
      if (emailUsed) {
        mergeAccount();
      } else {
        register();
      }
    } else {
      setShowRecoverButton(false);
      setShowRecoverDialog(true);
    }
  }

  function mergeAccount() {
    return postData('/api/hoauser/google-merge', { credential })
      .then(({ hoaUser }) => {
        if (hoaUser) {
          global.loadHoaUser(hoaUser);
          if (!skipRedirect) {
            defaultLanding();
            close();
          }
        }
      })
      .catch((e) => {
        exceptionMessage(e);
      });
  }

  function register() {
    postData('/api/hoauser', payload)
      .then(({ hoaUser }) => {
        if (!skipRedirect) {
          defaultLanding();
        }
        global.loadHoaUser(hoaUser);
        close();
      })
      .catch((e) => {
        exceptionMessage(e);
      });
  }

  async function onGoogleSignIn(payload, credential) {
    const {
      sub: password,
      email,
      email_verified: emailVerified,
      given_name: name,
      name: fullName,
    } = payload;
    setPayload({ password, email, emailVerified, name, fullName });
    setEmail(email);
    setPassword(password);
    signIn({ email, password });
    setCredential(credential);
  }

  return (
    <Fragment>
      <Dialog
        open={!showRecoverDialog && control.isOpen()}
        onClose={close}
        fullWidth={true}
        maxWidth="xs"
        PaperProps={{
          component: 'form',
          onSubmit: (event) => {
            event.preventDefault();
            const data = formData(event);
            signIn(data);
          },
        }}
      >
        <DialogTitle>Sign in</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            required
            margin="dense"
            id="email"
            name="email"
            label="Email"
            fullWidth
            variant="standard"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearEmailError();
            }}
          />
          <TextField
            required
            margin="dense"
            id="password"
            name="password"
            label="Password"
            type="password"
            fullWidth
            variant="standard"
            autoComplete="new-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearEmailError();
            }}
          />
          <Alert
            sx={{
              visibility: errorMessage ? 'visible' : 'hidden',
              flexGrow: '1',
            }}
            severity="error"
            action={
              showRecoverButton && (payload.emailVerified || emailUsed) ? (
                <Button size="small" onClick={triggerRecoverDialog}>
                  {payload.emailVerified
                    ? emailUsed
                      ? 'Merge account'
                      : 'Sign up'
                    : 'Forgot password'}
                </Button>
              ) : (
                ''
              )
            }
          >
            {errorMessage}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>Cancel</Button>
          <Button variant="contained" type="submit">
            Sign in
          </Button>
        </DialogActions>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderTop: 'solid 1px rgba(0,0,0, 0.12)',
            height: '80px',
          }}
        >
          <GoogleSignIn
            googleClientId={window.getFlag('googleClientId')}
            text="signin_with"
            onSignIn={onGoogleSignIn}
            personalized={true}
          />
        </div>
      </Dialog>

      <RecoveryDialog control={recoveryControl} defaultEmail={email} />
    </Fragment>
  );
};

export default SinginDialog;
