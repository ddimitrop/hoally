import { useContext, useState, Fragment } from 'react';
import { Global } from './Global.js';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import { sendValidationEmail } from './email-utils.js';

const Content = () => {
  const global = useContext(Global);
  let [resendSuccess, setResendSuccess] = useState(false);
  const closeResendSuccess = () => setResendSuccess(false);
  const triggerEmailValidation = () => {
    sendValidationEmail(global.hoaUser.email).then(() => {
      setResendSuccess(true);
    });
  };

  const validationWarning = global.needsEmailValidation ? (
    <Fragment>
      <Alert
        severity="warning"
        sx={{
          flexGrow: 1,
        }}
        action={
          <Button color="inherit" size="small" onClick={triggerEmailValidation}>
            Send again
          </Button>
        }
      >
        Your email has not been validated. Please look for the validation emai
        in your inbox.
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
  return <Box>{validationWarning}</Box>;
};

export default Content;
