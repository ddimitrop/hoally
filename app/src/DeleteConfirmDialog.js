import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { useState, useContext, Fragment } from 'react';
import { postData } from './json-utils.js';
import ConfirmDialog from './ConfirmDialog.js';

const DeleteConfirmDialog = ({
  control,
  onDelete,
  deleteApiPath,
  deleteTitle,
  deleteText,
  deleteSuccessText,
}) => {
  let [errorMessage, setErrorMessage] = useState('');
  let [deleteSuccess, setDeleteSuccess] = useState(false);

  function close() {
    setErrorMessage('');
    setDeleteSuccess(false);
  }

  function closeDeleteSuccess() {
    setDeleteSuccess(false);
  }

  function exceptionMessage({ message }) {
    setErrorMessage(`There was a problem: "${message}" - please try again.`);
  }

  function deleteAccount() {
    postData(deleteApiPath, {}, 'DELETE')
      .then(({ ok }) => {
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
        action="Delete"
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
