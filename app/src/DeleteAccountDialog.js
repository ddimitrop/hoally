import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Snackbar from '@mui/material/Snackbar';
import { useState, useContext, Fragment } from 'react';
import { Global } from './Global.js';
import { postData } from './json-utils.js';
import { useLogout } from './Navigate.js';

const DeleteAccountDialog = ({ control }) => {
  const global = useContext(Global);
  const logout = useLogout();
  let [errorMessage, setErrorMessage] = useState('');
  let [deleteSuccess, setDeleteSuccess] = useState(false);

  function close() {
    setErrorMessage('');
    setDeleteSuccess(false);
    control.close();
  }

  function closeDeleteSuccess() {
    setDeleteSuccess(false);
  }

  function exceptionMessage({ message }) {
    setErrorMessage(`There was a problem: "${message}" - please try again.`);
  }

  function deleteAccount() {
    postData('/api/hoauser', {}, 'DELETE')
      .then(({ ok }) => {
        if (ok) {
          global.loadHoaUser({});
          setDeleteSuccess(true);
          control.close();
          logout();
        }
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
        PaperProps={{
          component: 'form',
          onSubmit: (event) => {
            event.preventDefault();
            deleteAccount();
          },
        }}
      >
        <DialogTitle>Delete account</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <Alert severity="warning">
              Are you sure about this? Deleting your account cannot be undone.
            </Alert>
          </DialogContentText>
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
          <Button onClick={close}>Cancel</Button>
          <Button variant="contained" color="error" type="submit">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={deleteSuccess}
        onClose={closeDeleteSuccess}
      >
        <Alert onClose={closeDeleteSuccess} severity="success">
          Your account was deleted succesfully
        </Alert>
      </Snackbar>
    </Fragment>
  );
};

export default DeleteAccountDialog;
