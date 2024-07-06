import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { useState, useContext } from 'react';
import { Global } from './Global.js';
import { postData } from './json-utils.js';

const SinginDialog = (props) => {
  const { control } = props;
  const global = useContext(Global);
  let [errorMessage, setErrorMessage] = useState('');

  function close() {
    setErrorMessage('');
    control.close();
  }

  function exceptionMessage(e) {
    setErrorMessage(`There was a problem: "${e.message}".`);
  }

  async function signin(url, event) {
    const formData = new FormData(event.currentTarget);
    const formJson = Object.fromEntries(formData.entries());
    return postData(url, formJson);
  }

  return (
    <Dialog
      open={control.isOpen()}
      onClose={close}
      PaperProps={{
        component: 'form',
        onSubmit: (event) => {
          event.preventDefault();
          signin('/api/hoauser/signin', event)
            .then((hoaUser) => {
              if (hoaUser) {
                global.setHoaUser(hoaUser);
                if (!hoaUser.email_validated) {
                  global.setNeedsEmailValidation(true);
                }
                close();
              } else {
                setErrorMessage('Login failed');
                // TODO (recover);
              }
            })
            .catch((e) => {
              exceptionMessage(e);
            });
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
        >
          {errorMessage}
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button onClick={close}>Cancel</Button>
        <Button type="submit">Sign in</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SinginDialog;
