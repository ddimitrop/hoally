import { useContext, useEffect, useState, Fragment } from 'react';
import { Global } from './Global.js';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { sendValidationEmail } from './email-utils.js';
import { postData } from './json-utils.js';
import { useLoaderData, useNavigate } from 'react-router-dom';
import { ACCESS_TOKEN_INVALID } from './errors.mjs';

let hoaUserLoaded = false;

const Content = () => {
  const global = useContext(Global);
  const navigate = useNavigate();

  let [resendSuccess, setResendSuccess] = useState(false);
  let [validationSuccess, setValidationSuccess] = useState(false);
  let [invalidToken, setInvalidToken] = useState(false);

  const messageSeverity = () =>
    invalidToken ? 'error' : validationSuccess ? 'success' : 'warning';

  const messageContent = () =>
    invalidToken
      ? 'The validation link has expired. Please send a new one.'
      : validationSuccess
        ? 'Your account has been validated successfully!'
        : 'Your email has not been validated. Please look for the validation email in your inbox.';

  const closeResendSuccess = () => setResendSuccess(false);

  const triggerEmailValidation = () => {
    sendValidationEmail(global.hoaUser.email).then(() => {
      setResendSuccess(true);
    });
  };

  const loaddedData = useLoaderData();
  useEffect(() => {
    if (!hoaUserLoaded || !loaddedData) return;
    hoaUserLoaded = false;
    const { hoaUser, appError, error } = loaddedData;
    if (appError === ACCESS_TOKEN_INVALID) {
      setInvalidToken(true);
    } else if (hoaUser) {
      setValidationSuccess(true);
      global.loadHoaUser(hoaUser);
    } else if (error) {
      global.setAppError(error);
    }
    navigate('/', { replace: true });
  }, [loaddedData, navigate, global]);

  const validationWarning =
    global.needsEmailValidation || invalidToken || validationSuccess ? (
      <Fragment>
        <Alert
          severity={messageSeverity()}
          sx={{
            flexGrow: 1,
          }}
          action={
            validationSuccess ? (
              <IconButton
                size="small"
                aria-label="close"
                color="inherit"
                onClick={() => setValidationSuccess(false)}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            ) : (
              <Button
                color="inherit"
                size="small"
                onClick={triggerEmailValidation}
              >
                Send again
              </Button>
            )
          }
        >
          {messageContent()}
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

export async function emailLoader({ params }) {
  hoaUserLoaded = true;
  const { token } = params;
  try {
    return await postData('/api/hoauser/confirm/email', {
      token,
    });
  } catch ({ message: error }) {
    return { error };
  }
}

export default Content;
