import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { useContext, useState, Fragment } from 'react';
import { postData } from './json-utils.js';
import ConfirmDialog from './ConfirmDialog.js';
import { Global } from './Global.js';

const DeleteConfirmDialog = ({
  control,
  onDelete,
  onClose,
  deleteApiPath,
  deleteMethod,
  deleteAction,
  deleteTitle,
  deleteText,
  deleteSuccessText,
}) => {
  const global = useContext(Global);
  let [errorMessage, setErrorMessage] = useState('');
  let [deleteSuccess, setDeleteSuccess] = useState(false);

  function close() {
    setErrorMessage('');
    setDeleteSuccess(false);
    if (onClose) {
      onClose();
    }
  }

  function closeDeleteSuccess() {
    setDeleteSuccess(false);
  }

  function exceptionMessage({ message }) {
    setErrorMessage(`There was a problem: "${message}" - please try again.`);
  }

  function deleteAccount() {
    postData(deleteApiPath, {}, deleteMethod || 'DELETE')
      .then(({ ok, appError }) => {
        if (appError) {
          global.setAppError(appError);
        }
        if (ok) {
          setDeleteSuccess(true);
          control.close();
          onDelete();
        }
      })
      .catch((e) => {
        exceptionMessage(e);
      });
  }

  return (
    <Fragment>
      <ConfirmDialog
        control={control}
        onConfirm={deleteAccount}
        title={deleteTitle}
        text={deleteText}
        action={deleteAction || 'Delete'}
        onClose={close}
        errorMessage={errorMessage}
      />
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={deleteSuccess}
        onClose={closeDeleteSuccess}
      >
        <Alert onClose={closeDeleteSuccess} severity="success">
          {deleteSuccessText}
        </Alert>
      </Snackbar>
    </Fragment>
  );
};

export default DeleteConfirmDialog;
