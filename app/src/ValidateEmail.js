import { useContext, useEffect, useState } from 'react';
import { Global } from './Global.js';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { postData } from './json-utils.js';
import { useLoaderData } from 'react-router-dom';
import { ACCESS_TOKEN_INVALID } from './errors.mjs';
import { useMoveNext } from './Navigate.js';
import MarketingContent from './MarketingContent';

const ValidateEmail = () => {
  const global = useContext(Global);
  const moveNext = useMoveNext();

  let [validationSuccess, setValidationSuccess] = useState(false);
  let [invalidToken, setInvalidToken] = useState(false);

  const messageSeverity = () => (invalidToken ? 'error' : 'success');

  const messageContent = () =>
    invalidToken
      ? 'The validation link has expired. Please send a new one.'
      : 'Your account has been validated successfully!';

  function closeAlert() {
    setInvalidToken(false);
    setValidationSuccess(false);
    moveNext();
  }

  const loaddedData = useLoaderData();
  useEffect(() => {
    const { hoaUser, appError, error } = loaddedData;
    if (appError === ACCESS_TOKEN_INVALID) {
      setInvalidToken(true);
    } else if (hoaUser) {
      setValidationSuccess(true);
      global.loadHoaUser(hoaUser);
    } else if (error) {
      global.setAppError(error);
    }
  }, [loaddedData, global]);

  return (
    <Box>
      {invalidToken || validationSuccess ? (
        <Alert
          severity={messageSeverity()}
          onClose={closeAlert}
          sx={{
            flexGrow: 1,
          }}
          action={
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={() => closeAlert()}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        >
          {messageContent()}
        </Alert>
      ) : (
        ''
      )}
      <MarketingContent />
    </Box>
  );
};

export async function emailLoader({ params }) {
  const { token } = params;
  try {
    return await postData('/api/hoauser/confirm/email', {
      token,
    });
  } catch ({ message: error }) {
    return { error };
  }
}

export default ValidateEmail;
