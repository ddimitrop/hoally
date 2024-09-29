import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { useLoaderData } from 'react-router-dom';
import { postData } from './json-utils.js';
import { useContext, useEffect, useState, Fragment } from 'react';
import { INVITATION_TOKEN_INVALID } from './errors.mjs';
import { Global } from './Global';
import { useLogout } from './Navigate.js';

const InvitationReject = () => {
  const global = useContext(Global);
  const moveToLogout = useLogout();
  const [invalidToken, setInvalidToken] = useState(false);

  const loaddedData = useLoaderData();

  useEffect(() => {
    const { appError, error } = loaddedData;
    if (appError === INVITATION_TOKEN_INVALID) {
      setInvalidToken(true);
    } else if (error) {
      global.setAppError(error);
    }
  }, [loaddedData, global]);

  const clearup = () => {
    setInvalidToken(false);
  };

  const done = () => {
    clearup();
    moveToLogout();
  };

  return (
    <Fragment>
      <Snackbar
        anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
        open={true}
        onClose={done}
      >
        {invalidToken ? (
          <Alert onClose={done} severity="error">
            The invitation link has expired. Please look at your email inbox for
            a more recent invitation of contact yout Hoally community admin.
          </Alert>
        ) : (
          <Alert onClose={done} severity="success">
            Your email has been unassigned.
          </Alert>
        )}
      </Snackbar>
    </Fragment>
  );
};

export default InvitationReject;

export async function rejectLoader({ params: { token } }) {
  try {
    return await postData('/api/member/reject', { token });
  } catch ({ message: error }) {
    return { error };
  }
}
