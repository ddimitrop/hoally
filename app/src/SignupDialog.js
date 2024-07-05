import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { useState, useContext } from 'react';
import { Global } from './Global.js';
import { postData } from './json-utils.js';

const SingupDialog = (props) => {
  const { control } = props;
  const global = useContext(Global);
  let [errorMessage, setErrorMessage] = useState('');
  let [errorSeverity, setErrorSeverity] = useState('error');
  let [nameError, setNameError] = useState(false);
  let [emailError, setEmailError] = useState(false);
  let [invalidFields, setInvalidFields] = useState({});

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

  async function postForm(url, event) {
    const formData = new FormData(event.currentTarget);
    const formJson = Object.fromEntries(formData.entries());
    return postData(url, formJson);
  }

  function checkAlreadyUsed(field, label, callback) {
    return (event) => {
      const value = event.currentTarget.value;
      if (!value) return true;
      invalidFields[field] = value;
      setInvalidFields(invalidFields);
      postData(`/api/hoauser/validate/${field}`, { [field]: value })
        .then((value) => {
          if (!value) {
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
    postData('/hoauser/recover', invalidFields['email']).then((ok) => {
      if (ok) {
        setErrorMessage('Checkout of your emails for a recovery link.');
        setErrorSeverity('success');
      }
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
          if (nameError || emailError) return;
          postForm('/api/hoauser', event)
            .then((hoaUser) => {
              global.setHoaUser(hoaUser);
              close();
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
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexDiretion: 'row',
          }}
        >
          <Alert
            sx={{
              visibility: errorMessage ? 'visible' : 'hidden',
              flexGrow: '1',
            }}
            severity={errorSeverity}
          >
            {errorMessage}
          </Alert>
        </Box>
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
  );
};

export default SingupDialog;
