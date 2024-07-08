import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { useState, useContext } from 'react';
import { Global } from './Global.js';
import { formData } from './json-utils.js';
import { FormControl } from '@mui/material';
import { sendRecoverEmail } from './email-utils.js';
import { EMAIL_NOT_REGISTERED } from './errors.mjs';

const RecoveryDialog = (props) => {
  const { control } = props;
  const global = useContext(Global);
  let [emailSent, setEmailSent] = useState(false);
  let [unknownEmail, setUnknownEmail] = useState(false);

  function close() {
    setEmailSent(false);
    setUnknownEmail(false);
    control.close();
  }

  function recoverAccount({ email }) {
    setUnknownEmail(false);
    sendRecoverEmail(email)
      .then(({ appError }) => {
        if (appError === EMAIL_NOT_REGISTERED) {
          setUnknownEmail(true);
        }
        setEmailSent(true);
      })
      .catch(({ message }) => {
        global.setAppError(message);
      });
  }

  return (
    <Dialog
      open={control.isOpen()}
      onClose={close}
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
        <FormControl sx={{ minWidth: '350px' }}>
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
        </FormControl>
        <Alert
          sx={{
            visibility: emailSent ? 'visible' : 'hidden',
            flexGrow: '1',
          }}
          severity={unknownEmail ? 'error' : 'info'}
          onClose={close}
        >
          {unknownEmail ? 'Email not registered.' : 'Recovery email sent.'}
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button onClick={close}>Cancel</Button>
        <Button type="submit">Send recovery email</Button>
      </DialogActions>
    </Dialog>
  );
};

export default RecoveryDialog;
