import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Snackbar from '@mui/material/Snackbar';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import { useAlreadyUsedCheck } from './SignupDialog';
import { useState, useContext, Fragment } from 'react';
import { Global } from './Global.js';
import { postData } from './json-utils.js';
import { sendValidationEmail } from './email-utils.js';
import { formCapture, flagState, formData } from './state-utils.js';
import { useLogout } from './Navigate.js';

const SettingsDialog = ({ control }) => {
  const global = useContext(Global);
  let [wasChanged, setWasChanged] = useState(false);
  let [errorMessage, setErrorMessage] = useState('');
  let [signupSuccess, setSignupSuccess] = useState(false);
  const logout = useLogout();

  let [needValidationEmail, setNeedValidationEmail] = useState(false);

  const deleteDialog = flagState(useState(false));

  const previousPassword = '**********';
  let changePassword = (value) => {};

  const form = formCapture();

  function getFormValue(name) {
    return form.get(name) || global.hoaUser[name];
  }

  const onUsedField = ({ label }) => {
    setErrorMessage(`There is already an account with this ${label}.`);
  };

  const emailUsed = useAlreadyUsedCheck(
    'email',
    'email',
    onUsedField,
    exceptionMessage,
  );

  function checkEmailUsed(value) {
    if (value === global.hoaUser.email) return false;
    return emailUsed.check(value);
  }

  function clearEmailError() {
    setErrorMessage('');
    emailUsed.clearError();
  }

  const nameChanged = () => getFormValue('name') !== global.hoaUser.name;

  const emailChanged = () => getFormValue('email') !== global.hoaUser.email;

  const fullNameChanged = () =>
    getFormValue('full_name') !== global.hoaUser.full_name;

  const passwordChanged = () =>
    getFormValue('password') && getFormValue('password') !== previousPassword;

  function checkWasChanged() {
    const wasChanged =
      emailChanged() || nameChanged() || fullNameChanged() || passwordChanged();

    setWasChanged(wasChanged);
    return wasChanged;
  }

  function close() {
    clearEmailError();
    setWasChanged(false);
    control.close();
  }

  function closeSignupSuccess() {
    setSignupSuccess(false);
    setNeedValidationEmail(false);
  }

  function exceptionMessage({ message }) {
    setErrorMessage(`There was a problem: "${message}" - please try again.`);
  }

  async function ensureNotAlreadyUsed(data) {
    const { email } = data;
    if (!email || email === global.hoaUser.email) return true;
    return !(await emailUsed.check(email));
  }

  function updateSettings(data) {
    if (data.password === previousPassword) {
      delete data.password;
    }
    if (!checkWasChanged()) return;
    const didEmailChange = emailChanged();
    setNeedValidationEmail(didEmailChange);
    ensureNotAlreadyUsed(data)
      .then((ok) => {
        if (!ok || emailUsed.hasError()) return;
        return postData('/api/hoauser', data, 'PUT').then(({ hoaUser }) => {
          global.loadHoaUser(hoaUser);
          close();
          if (didEmailChange) {
            sendValidationEmail(hoaUser.email)
              .then(() => {
                setSignupSuccess(true);
              })
              .catch((e) => {
                global.setAppError(e.message);
              });
          } else {
            setSignupSuccess(true);
          }
        });
      })
      .catch((e) => {
        exceptionMessage(e);
      });
  }

  function showDeleteAccount() {
    close();
    deleteDialog.open();
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
            updateSettings(data);
          },
        }}
      >
        <DialogTitle>Account settings</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            id="name"
            name="name"
            label="Nickname"
            defaultValue={global.hoaUser.name}
            fullWidth
            variant="standard"
            autoComplete="name"
            onChange={() => checkWasChanged()}
            ref={(node) => form.provide(node, 'name')}
          />
          <TextField
            margin="dense"
            id="fullName"
            name="fullName"
            label="Full name"
            defaultValue={global.hoaUser.full_name}
            fullWidth
            variant="standard"
            autoComplete="name"
            onChange={() => checkWasChanged()}
            ref={(node) => form.provide(node, 'full_name')}
          />
          <TextField
            required
            margin="dense"
            id="email"
            name="email"
            label="Email Address"
            defaultValue={global.hoaUser.email}
            type="email"
            fullWidth
            variant="standard"
            autoComplete="email"
            error={emailUsed.hasError()}
            onChange={() => {
              clearEmailError();
              checkWasChanged();
            }}
            onBlur={(event) => checkEmailUsed(event.currentTarget.value)}
            ref={(node) => form.provide(node, 'email')}
          />
          <TextField
            required
            margin="dense"
            id="password"
            name="password"
            label="Password"
            type="password"
            defaultValue={previousPassword}
            fullWidth
            variant="standard"
            autoComplete="new-password"
            onChange={() => checkWasChanged()}
            onFocus={() => {
              if (getFormValue('password') === previousPassword) {
                changePassword('');
              }
            }}
            onBlur={() => {
              if (!getFormValue('password')) {
                changePassword(previousPassword);
              }
            }}
            ref={(node) => {
              form.provide(node, 'password');
              changePassword = (v) => {
                node.querySelector('input').value = v;
              };
            }}
            InputLabelProps={{
              shrink: true,
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
          <Button color="error" onClick={showDeleteAccount}>
            Delete account
          </Button>
          <Box sx={{ flex: 1 }}></Box>
          <Button onClick={close}>Cancel</Button>
          <Button type="submit" disabled={!wasChanged}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={signupSuccess} onClose={closeSignupSuccess}>
        <Alert
          onClose={closeSignupSuccess}
          severity={needValidationEmail ? 'info' : 'success'}
        >
          {needValidationEmail
            ? 'Your account changes require email revalidation. Please check out your inbox.'
            : 'Your account was changed succesfully!'}
        </Alert>
      </Snackbar>
      <DeleteConfirmDialog
        control={deleteDialog}
        onDelete={() => {
          global.loadHoaUser({});
          logout();
        }}
        deleteApiPath="/api/hoauser"
        deleteTitle="Delete account"
        deleteText={
          <span>
            Are you sure about this? <br />
            Deleting your account will remove you from all your communities.
            <b> It cannot be undone.</b>
          </span>
        }
        deleteSuccessText="Your account was deleted succesfully"
      />
    </Fragment>
  );
};

export default SettingsDialog;
