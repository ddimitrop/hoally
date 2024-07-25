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
import { formCapture, formData } from './state-utils.js';
import { useDefaultLanding } from './Navigate.js';

export function useAlreadyUsedCheck(field, label, onUsed, onException) {
  let [error, setError] = useState(false);
  // Last checked value and result for caching.
  let value, isUsed;

  async function check(newValue) {
    if (!newValue) return true;
    if (value === newValue) return isUsed;
    value = newValue;
    try {
      const { ok } = await postData(`/api/hoauser/validate/${field}`, {
        [field]: value,
      });
      isUsed = !ok;
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

const SingupDialog = ({ control }) => {
  const global = useContext(Global);
  const defaultLanding = useDefaultLanding();
  let [errorMessage, setErrorMessage] = useState('');
  let [recoveryLinkSuccess, setRecoveryLinkSuccess] = useState(false);
  let [signupSuccess, setSignupSuccess] = useState(false);
  const closeSignupSuccess = () => {
    setSignupSuccess(false);
    defaultLanding();
  };
  const closeRecoveryLinkSuccess = () => setRecoveryLinkSuccess(false);
  const form = formCapture();

  const onUsedField = ({ label }) => {
    setErrorMessage(`There is already an account with this ${label}.`);
  };

  const emailUsed = useAlreadyUsedCheck(
    'email',
    'email',
    onUsedField,
    exceptionMessage,
  );

  const nameUsed = useAlreadyUsedCheck(
    'name',
    'nickname',
    onUsedField,
    exceptionMessage,
  );

  function clearNameError() {
    setErrorMessage('');
    nameUsed.clearError();
  }

  function clearEmailError() {
    setErrorMessage('');
    emailUsed.clearError();
  }

  function close() {
    clearNameError();
    clearEmailError();
    control.close();
  }

  function exceptionMessage({ message }) {
    setErrorMessage(`There was a problem: "${message}" - please try again.`);
  }

  async function validateName(name) {
    if (name.match(/@.*\.,*/)) {
      setErrorMessage(`The nickname is shown in posts - no emails please.`);
      return false;
    }
    return !(await nameUsed.check(name));
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
        if (!ok || nameUsed.hasError() || emailUsed.hasError()) return;
        return postData('/api/hoauser', data).then(({ hoaUser }) => {
          global.loadHoaUser(hoaUser);
          close();
          sendValidationEmail(hoaUser.email)
            .then(() => {
              setSignupSuccess(true);
            })
            .catch((e) => {
              global.setAppError(e.message);
            });
        });
      })
      .catch((e) => {
        exceptionMessage(e);
      });
  }

  function recoverAccount() {
    sendRecoverEmail(form.get('email'))
      .then(() => {
        close();
        setRecoveryLinkSuccess(true);
      })
      .catch((e) => {
        exceptionMessage(e);
      });
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
            error={nameUsed.hasError()}
            onChange={clearNameError}
            onBlur={(event) => validateName(event.currentTarget.value)}
          />
          <TextField
            margin="dense"
            id="fullName"
            name="fullName"
            label="Full name"
            fullWidth
            variant="standard"
            autoComplete="name"
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
            onChange={clearEmailError}
            onBlur={(event) => emailUsed.check(event.currentTarget.value)}
            ref={(node) => form.provide(node, 'email')}
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
            Forgot password
          </Button>
          <Button onClick={close}>Cancel</Button>
          <Button type="submit">Subscribe</Button>
        </DialogActions>
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
