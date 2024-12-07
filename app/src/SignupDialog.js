import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Snackbar from '@mui/material/Snackbar';
import { useState, useContext, Fragment } from 'react';
import { Global } from './Global.js';
import { postData } from './json-utils.js';
import { sendValidationEmail, sendRecoverEmail } from './email-utils.js';
import { formData } from './state-utils.js';
import { useDefaultLanding } from './Navigate.js';
import GoogleSignIn from './GoogleSignIn.js';

export async function isFieldUsed(field, value) {
  const { ok } = await postData(`/api/hoauser/validate/${field}`, {
    [field]: value,
  });
  return !ok;
}

export function useAlreadyUsedCheck(field, label, onUsed, onException) {
  let [error, setError] = useState(false);
  // Last checked value and result for caching.
  let value, isUsed;

  async function check(newValue) {
    if (!newValue) return true;
    if (value === newValue) return isUsed;
    value = newValue;
    try {
      isUsed = await isFieldUsed(field, value);
      if (isUsed) {
        onUsed({ field, label, value });
      }
      setError(isUsed);
      return isUsed;
    } catch (e) {
      onException(e);
      return true;
    }
  }

  return {
    hasError: () => error,
    check,
    clearError: () => {
      setError(false);
    },
  };
}

const SingupDialog = ({ control, skipRedirect, defaultEmail }) => {
  const global = useContext(Global);
  const defaultLanding = useDefaultLanding();
  let [errorMessage, setErrorMessage] = useState('');
  let [recoveryLinkSuccess, setRecoveryLinkSuccess] = useState(false);
  let [signupSuccess, setSignupSuccess] = useState(false);
  const [name, setName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(defaultEmail || '');
  const [password, setPassword] = useState('');
  const [passwordDisabled, setPasswordDisabled] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [credential, setCredential] = useState('');

  const closeSignupSuccess = () => {
    setSignupSuccess(false);
    if (!skipRedirect) {
      defaultLanding();
    }
  };
  const closeRecoveryLinkSuccess = () => setRecoveryLinkSuccess(false);

  const onUsedField = ({ label }) => {
    setErrorMessage(`There is already an account with this ${label}.`);
  };

  const emailUsed = useAlreadyUsedCheck(
    'email',
    'email',
    onUsedField,
    exceptionMessage,
  );

  function clearEmailError() {
    setErrorMessage('');
    emailUsed.clearError();
    if (passwordDisabled) {
      setPassword('');
      setPasswordDisabled(false);
    }
    setEmailVerified(false);
    setCredential('');
  }

  function close() {
    setName('');
    setFullName('');
    setEmail('');
    setPassword('');
    setPasswordDisabled(false);
    clearEmailError();
    control.close();
  }

  async function onGoogleSignUp(payload, credential) {
    const {
      sub,
      email,
      email_verified: emailVerified,
      given_name: name,
      name: fullName,
    } = payload;
    setEmail(email);
    setName(name);
    setFullName(fullName);
    setPassword(sub);
    setPasswordDisabled(true);
    setEmailVerified(emailVerified);
    setCredential(credential);
  }

  function exceptionMessage({ message }) {
    setErrorMessage(`There was a problem: "${message}" - please try again.`);
  }

  async function validateName(name) {
    if (name.match(/@.*\.,*/)) {
      setErrorMessage(`The nickname is shown in posts - no emails please.`);
      return false;
    }
    return true;
  }

  async function ensureNotAlreadyUsed(data) {
    // It is possible to submit the form without onBlur
    // when using autocomplete
    const { email, name } = data;
    const nameOk = await validateName(name);
    const emailOK = !(await emailUsed.check(email));

    return nameOk && emailOK;
  }

  function register(data) {
    ensureNotAlreadyUsed(data)
      .then((ok) => {
        if (!ok || emailUsed.hasError()) return;
        data.emailVerified = emailVerified;
        if (!data.password) data.password = password;
        return postData('/api/hoauser', data).then(({ hoaUser }) => {
          if (!defaultEmail || hoaUser.email !== defaultEmail) {
            if (!emailVerified) {
              sendValidationEmail(hoaUser.email)
                .then(() => {
                  setSignupSuccess(true);
                })
                .catch((e) => {
                  global.setAppError(e.message);
                });
            } else {
              if (!skipRedirect) {
                defaultLanding();
              }
            }
          } else {
            hoaUser.email_validated = true;
          }
          global.loadHoaUser(hoaUser);
          close();
        });
      })
      .catch((e) => {
        exceptionMessage(e);
      });
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

  function recoverAccount() {
    if (emailVerified) {
      mergeAccount();
    } else {
      sendRecoverEmail(email)
        .then(() => {
          close();
          setRecoveryLinkSuccess(true);
        })
        .catch((e) => {
          exceptionMessage(e);
        });
    }
  }

  return (
    <Fragment>
      <Dialog
        open={control.isOpen()}
        onClose={close}
        fullWidth={true}
        maxWidth="sm"
        scroll="body"
        PaperProps={{
          component: 'form',
          onSubmit: (event) => {
            event.preventDefault();
            const data = formData(event);
            register(data);
          },
        }}
      >
        <DialogTitle>Subscribe</DialogTitle>
        <DialogContent>
          <DialogContentText>Sign up to use HOAlly.</DialogContentText>
          <TextField
            autoFocus
            required
            margin="dense"
            id="name"
            name="name"
            label="Nickname"
            fullWidth
            variant="standard"
            autoComplete="first-name"
            onBlur={(event) => validateName(event.currentTarget.value)}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
            }}
          />
          <TextField
            margin="dense"
            id="fullName"
            name="fullName"
            label="Full name"
            fullWidth
            variant="standard"
            autoComplete="name"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
            }}
          />
          <TextField
            required
            margin="dense"
            id="email"
            name="email"
            label="Email Address"
            type="email"
            fullWidth
            variant="standard"
            autoComplete="email"
            error={emailUsed.hasError()}
            onBlur={(event) => emailUsed.check(event.currentTarget.value)}
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
            disabled={passwordDisabled}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
            }}
          />
          <Alert
            sx={{
              visibility: errorMessage ? 'visible' : 'hidden',
            }}
            severity="error"
          >
            {errorMessage}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button
            sx={{
              display: emailUsed.hasError() ? 'inline-block' : 'none',
            }}
            onClick={recoverAccount}
          >
            {emailVerified ? 'Merge account' : 'Forgot password'}
          </Button>
          <Button onClick={close}>Cancel</Button>
          <Button variant="contained" type="submit">
            Subscribe
          </Button>
        </DialogActions>
        <div className="documents-small">
          <a href="/privacy.html" target="_blank">
            Privacy policy
          </a>{' '}
          -
          <a href="/terms.html" target="_blank">
            Terms of use
          </a>
        </div>
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
            text="signup_with"
            onSignIn={onGoogleSignUp}
            personalized={false}
          />
        </div>
      </Dialog>
      <Snackbar open={signupSuccess} onClose={closeSignupSuccess}>
        <Alert onClose={closeSignupSuccess} severity="info">
          Your new account requires email validation. Please check out your
          inbox.
        </Alert>
      </Snackbar>
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={recoveryLinkSuccess}
        onClose={closeRecoveryLinkSuccess}
      >
        <Alert onClose={closeRecoveryLinkSuccess} severity="info">
          Checkout of your emails for a recovery link..
        </Alert>
      </Snackbar>
    </Fragment>
  );
};

export default SingupDialog;
