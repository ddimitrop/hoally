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
import { postData, formData } from './json-utils.js';
import { sendValidationEmail, sendRecoverEmail } from './email-utils.js';

const invalidFields = {};

const SingupDialog = (props) => {
  const { control } = props;
  const global = useContext(Global);
  let [errorMessage, setErrorMessage] = useState('');
  let [errorSeverity, setErrorSeverity] = useState('error');
  let [nameError, setNameError] = useState(false);
  let [emailError, setEmailError] = useState(false);
  let [signupSuccess, setSignupSuccess] = useState(false);
  const closeSignupSuccess = () => setSignupSuccess(false);

  function clearNameError() {
    setErrorMessage('');
    setNameError(false);
  }

  function clearEmailError() {
    setErrorMessage('');
    setEmailError(false);
  }

  function close() {
    clearNameError();
    clearEmailError();
    control.close();
  }

  function exceptionMessage({ message }) {
    setErrorMessage(`There was a problem: "${message}" - please try again.`);
  }

  async function checkField(field, label, value) {
    invalidFields[field] = value;
    try {
      const { ok } = await postData(`/api/hoauser/validate/${field}`, {
        [field]: value,
      });
      if (!ok) {
        setErrorSeverity('error');
        setErrorMessage(`There is already an account with this ${label}.`);
        return true;
      } else {
        return false;
      }
    } catch (e) {
      exceptionMessage(e);
    }
  }

  function checkNameField(value) {
    if (!value) return;
    return checkField('name', 'nickname', value).then(
      (ok) => setNameError(ok) || ok,
    );
  }

  function checkEmailField(value) {
    if (!value) return;
    return checkField('email', 'email', value).then(
      (ok) => setEmailError(ok) || ok,
    );
  }

  async function ensureNotAlreadyUsed(data) {
    // It is possible to submit the form without onBlur
    // when using autocomplete
    let nameUsed = false;
    let emailUsed = false;
    const { email: checkedEmail, name: checkedName } = invalidFields;
    const { email, name } = data;

    if (checkedName !== name) {
      nameUsed = await checkNameField(name);
    }
    if (checkedEmail !== email) {
      emailUsed = await checkEmailField(email);
    }
    return !nameUsed && !emailUsed;
  }

  function register(data) {
    ensureNotAlreadyUsed(data)
      .then((ok) => {
        if (!ok || nameError || emailError) return;
        return postData('/api/hoauser', data).then(({ hoaUser }) => {
          global.setHoaUser(hoaUser);
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
    sendRecoverEmail(invalidFields['email'])
      .then(() => {
        setErrorMessage('Checkout of your emails for a recovery link.');
        setErrorSeverity('info');
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
            error={nameError}
            onChange={clearNameError}
            onBlur={(event) => checkNameField(event.currentTarget.value)}
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
            error={emailError}
            onChange={clearEmailError}
            onBlur={(event) => checkEmailField(event.currentTarget.value)}
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
            severity={errorSeverity}
          >
            {errorMessage}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button
            sx={{
              display: emailError ? 'inline-block' : 'none',
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
          Your new account requires email validation. Please look for the
          validation emai in your inbox.
        </Alert>
      </Snackbar>
    </Fragment>
  );
};

export default SingupDialog;
