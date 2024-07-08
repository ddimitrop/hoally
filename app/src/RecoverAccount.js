import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import Snackbar from '@mui/material/Snackbar';
import { Global } from './Global.js';
import RecoveryDialog from './RecoveryDialog.js';
import { useContext, useState, Fragment } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { postData, formData } from './json-utils.js';
import { ACCESS_TOKEN_INVALID } from './errors.mjs';

const RecoverAccount = () => {
  const global = useContext(Global);
  let { token } = useParams();
  const navigate = useNavigate();
  let [changePassword, setChangePassword] = useState(true);
  let [passwordChanged, setPasswordChanged] = useState(false);
  let [invalidToken, setInvalidToken] = useState(false);
  let [showRecoveryDialog, setShowRecoveryDialog] = useState(false);

  function close() {
    setChangePassword(false);
  }

  function finish() {
    setChangePassword(false);
    setPasswordChanged(false);
    setInvalidToken(false);
    setShowRecoveryDialog(false);
    navigate('/');
  }

  function setNewPassword(token, password) {
    postData('/api/hoauser/recover', { token, password })
      .then(({ hoaUser, appError }) => {
        if (hoaUser) {
          global.loadHoaUser(hoaUser);
          setPasswordChanged(true);
          close();
        } else if (appError === ACCESS_TOKEN_INVALID) {
          setChangePassword(false);
          setInvalidToken(true);
        }
      })
      .catch(({ message }) => {
        global.setAppError(message);
      });
  }

  function recoverAccount() {
    setInvalidToken(false);
    setShowRecoveryDialog(true);
  }

  const recoveryControl = {
    isOpen: () => showRecoveryDialog,
    close: () => {
      setShowRecoveryDialog(false);
      navigate('/', { replace: true });
    },
  };

  return (
    <Fragment>
      <Dialog
        open={changePassword}
        onClose={close}
        PaperProps={{
          component: 'form',
          onSubmit: (event) => {
            event.preventDefault();
            const { password } = formData(event);
            setNewPassword(token, password);
          },
        }}
      >
        <DialogTitle>Set new password</DialogTitle>
        <DialogContent>
          <FormControl sx={{ minWidth: '350px' }}>
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
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>Cancel</Button>
          <Button type="submit">Set password</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={passwordChanged}>
        <Alert severity="success" onClose={finish}>
          Your password was changed successfully!
        </Alert>
      </Snackbar>

      {/* ---- Invalid token UI ---- */}

      <Dialog
        open={invalidToken}
        onClose={() => setInvalidToken(false)}
        PaperProps={{
          component: 'form',
          onSubmit: (event) => {
            event.preventDefault();
          },
        }}
      >
        <DialogTitle>Invalid recovery link</DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            The account recovery link has expired. Please send a new one.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={recoverAccount}>Send again</Button>
        </DialogActions>
      </Dialog>
      <RecoveryDialog control={recoveryControl} />
    </Fragment>
  );
};

export default RecoverAccount;

export async function recoverLoader({ params: { token } }) {
  try {
    return await postData('/api/hoauser/token', { token });
  } catch ({ message: error }) {
    return { error };
  }
}
