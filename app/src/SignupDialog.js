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
import { postData, postForm } from './json-utils.js';
import { sendValidationEmail } from './email-utils.js';

const SingupDialog = (props) => {
  const { control } = props;
  const global = useContext(Global);
  let [errorMessage, setErrorMessage] = useState('');
  let [errorSeverity, setErrorSeverity] = useState('error');
  let [nameError, setNameError] = useState(false);
  let [emailError, setEmailError] = useState(false);
  let [invalidFields, setInvalidFields] = useState({});
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

  function exceptionMessage(e) {
    setErrorMessage(`There was a problem: "${e.message}" - please try again.`);
  }

  function checkAlreadyUsed(field, label, callback) {
    return (event) => {
      const value = event.currentTarget.value;
      if (!value) return true;
      invalidFields[field] = value;
      setInvalidFields(invalidFields);
      postData(`/api/hoauser/validate/${field}`, { [field]: value })
        .then(({ ok }) => {
          if (!ok) {
            setErrorSeverity('error');
            setErrorMessage(`There is already an account with this ${label}.`);
            callback(true);
          } else {
            callback(false);
          }
        })
        .catch((e) => {
          exceptionMessage(e);
        });
    };
  }

  function recoverAccount() {
    // TO DO
    postData('/hoauser/recover', invalidFields['email']).then((ok) => {
      if (ok) {
        setErrorMessage('Checkout of your emails for a recovery link.');
        setErrorSeverity('success');
      }
    });
  }

  return (
    <Fragment>
      <Dialog
        open={control.isOpen()}
        onClose={close}
        PaperProps={{
          component: 'form',
          onSubmit: (event) => {
            event.preventDefault();
            if (nameError || emailError) return;
            postForm('/api/hoauser', event)
              .then(({ hoaUser }) => {
                global.setHoaUser(hoaUser);
                close();
                sendValidationEmail(hoaUser.email)
                  .then(() => {
                    setSignupSuccess(true);
                  })
                  .catch((e) => {
                    global.setAppError(e.message);
                  });
              })
              .catch((e) => {
                exceptionMessage(e);
              });
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
            onBlur={checkAlreadyUsed('name', 'nickname', setNameError)}
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
            onBlur={checkAlreadyUsed('email', 'email', setEmailError)}
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
            Recover account
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
