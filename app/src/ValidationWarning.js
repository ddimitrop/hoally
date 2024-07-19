import { useContext, useState, Fragment } from 'react';
import { Global } from './Global.js';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { sendValidationEmail } from './email-utils.js';

const ValidationWarning = () => {
  const global = useContext(Global);
  let [open, setOpen] = useState(true);
  let [resendSuccess, setResendSuccess] = useState(false);

  function closeAlert() {
    closeResendSuccess();
    setOpen(false);
  }

  const closeResendSuccess = () => setResendSuccess(false);

  const triggerEmailValidation = () => {
    sendValidationEmail(global.hoaUser.email).then(() => {
      setResendSuccess(true);
    });
  };

  return global.needsEmailValidation && open ? (
    <Fragment>
      <Alert
        severity="warning"
        onClose={closeAlert}
        sx={{
          flexGrow: 1,
        }}
        action={
          <Fragment>
            <Button
              color="inherit"
              size="small"
              onClick={triggerEmailValidation}
            >
              Send again
            </Button>
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={() => closeAlert()}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Fragment>
        }
      >
        Your email has not been validated. Please check out your inbox.
      </Alert>
      <Snackbar open={resendSuccess} onClose={closeResendSuccess}>
        <Alert onClose={closeResendSuccess} severity="info">
          A new validation emai has been sent in your inbox.
        </Alert>
      </Snackbar>
    </Fragment>
  ) : (
    ''
  );
};

export default ValidationWarning;
