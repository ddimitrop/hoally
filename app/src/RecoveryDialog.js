import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { useState, useContext, Fragment } from 'react';
import { Global } from './Global.js';
import { formData } from './state-utils.js';
import Snackbar from '@mui/material/Snackbar';
import { sendRecoverEmail } from './email-utils.js';
import { EMAIL_NOT_REGISTERED } from './errors.mjs';

const RecoveryDialog = (props) => {
  const { control } = props;
  const global = useContext(Global);
  let [emailSent, setEmailSent] = useState(false);
  let [unknownEmail, setUnknownEmail] = useState(false);
  let closeEmailSend = () => setEmailSent(false);

  function close() {
    setUnknownEmail(false);
    control.close();
  }

  function recoverAccount({ email }) {
    setUnknownEmail(false);
    sendRecoverEmail(email)
      .then(({ appError }) => {
        if (appError === EMAIL_NOT_REGISTERED) {
          setUnknownEmail(true);
        } else {
          close();
          setEmailSent(true);
        }
      })
      .catch(({ message }) => {
        global.setAppError(message);
      });
  }

  return (
    <Fragment>
      <Dialog
        open={control.isOpen()}
        onClose={close}
        fullWidth={true}
        maxWidth="xs"
        PaperProps={{
          component: 'form',
          onSubmit: (event) => {
            event.preventDefault();
            const data = formData(event);
            recoverAccount(data);
          },
        }}
      >
        <DialogTitle>Recover account</DialogTitle>
        <DialogContent>
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
          />
          <Alert
            sx={{
              visibility: unknownEmail ? 'visible' : 'hidden',
              flexGrow: '1',
            }}
            severity="error"
            onClose={close}
          >
            Email not registered.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>Cancel</Button>
          <Button type="submit">Send recovery email</Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={emailSent}
        onClose={closeEmailSend}
      >
        <Alert onClose={closeEmailSend} severity="info">
          Recovery email sent
        </Alert>
      </Snackbar>
    </Fragment>
  );
};

export default RecoveryDialog;
