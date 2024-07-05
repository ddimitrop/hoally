import Snackbar from '@mui/material/Snackbar';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { useContext } from 'react';
import { Global } from './Global.js';

const GlobalSnackBar = ({ error }) => {
  const global = useContext(Global);
  const action = (
    <IconButton
      size="small"
      aria-label="close"
      color="inherit"
      onClick={() => global.set(error, '')}
    >
      <CloseIcon fontSize="small" />
    </IconButton>
  );

  return (
    <Snackbar
      open={!!global.get(error)}
      autoHideDuration={6000}
      onClose={() => global.set(error, '')}
      message={global.get(error)}
      action={action}
    />
  );
};

export default GlobalSnackBar;
