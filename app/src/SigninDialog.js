import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { useState, useContext, Fragment } from 'react';
import { Global } from './Global.js';
import { postData, formData } from './json-utils.js';
import { LOGIN_ERROR } from './errors.mjs';
import RecoveryDialog from './RecoveryDialog.js';
import { useDefaultLanding } from './Navigate.js';

const SinginDialog = (props) => {
  const { control } = props;
  const global = useContext(Global);
  const defaultLanding = useDefaultLanding();
  let [errorMessage, setErrorMessage] = useState('');
  let [showRecoverButton, setShowRecoverButton] = useState(false);
  let [showRecoverDialog, setShowRecoverDialog] = useState(false);

  function close() {
    setErrorMessage('');
    setShowRecoverButton(false);
    setShowRecoverDialog(false);
    control.close();
  }

  const recoveryControl = {
    isOpen: () => showRecoverDialog && control.isOpen(),
    close,
  };

  function exceptionMessage(e) {
    setErrorMessage(`There was a problem: "${e.message}".`);
  }

  function signIn(data) {
    postData('/api/hoauser/signin', data)
      .then(({ hoaUser, appError }) => {
        if (hoaUser) {
          global.loadHoaUser(hoaUser);
          defaultLanding();
          close();
        } else {
          setErrorMessage(appError);
          setShowRecoverButton(appError === LOGIN_ERROR);
        }
      })
      .catch((e) => {
        exceptionMessage(e);
      });
  }

  function triggerRecoverDialog() {
    setShowRecoverButton(false);
    setShowRecoverDialog(true);
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
            id="name"
            name="name"
            label="Nickname"
            fullWidth
            variant="standard"
            autoComplete="first-name"
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
              flexGrow: '1',
            }}
            severity="error"
            action={
              showRecoverButton ? (
                <Button size="small" onClick={triggerRecoverDialog}>
                  Forgot password
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
          <Button type="submit">Sign in</Button>
        </DialogActions>
      </Dialog>

      <RecoveryDialog control={recoveryControl} />
    </Fragment>
  );
};

export default SinginDialog;
