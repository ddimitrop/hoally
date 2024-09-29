import Snackbar from '@mui/material/Snackbar';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { useContext } from 'react';
import { Global } from './Global.js';

const GlobalSnackBar = () => {
  const global = useContext(Global);
  const action = (
    <IconButton
      size="small"
      aria-label="close"
      color="inherit"
      onClick={() => global.appErrorClose.onClose()}
    >
      <CloseIcon fontSize="small" />
    </IconButton>
  );

  return (
    <Snackbar
      open={!!global.appError}
      autoHideDuration={6000}
      onClose={() => global.appErrorClose.onClose()}
      message={global.appError}
      action={action}
    />
  );
};

export default GlobalSnackBar;
