import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Snackbar from '@mui/material/Snackbar';
import { useLoaderData } from 'react-router-dom';
import { postData } from './json-utils.js';
import { useContext, useEffect, useState, Fragment } from 'react';
import { INVITATION_TOKEN_INVALID } from './errors.mjs';
import { Global } from './Global';
import { useLogout } from './Navigate.js';
import { flagState } from './state-utils.js';
import SingupDialog from './SignupDialog';
import SinginDialog from './SigninDialog';
import { useNavigate, useParams } from 'react-router-dom';

const InvitationAccept = () => {
  const global = useContext(Global);
  const moveToLogout = useLogout();
  const navigate = useNavigate();
  const { token } = useParams();
  const [invalidToken, setInvalidToken] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [invitationAccepted, setInvitationAccepted] = useState(false);
  const [invitation, setInvitation] = useState({});
  const signup = flagState(useState(false));
  const signin = flagState(useState(false));

  const loaddedData = useLoaderData();

  useEffect(() => {
    const { invitation, appError, error } = loaddedData;
    if (appError === INVITATION_TOKEN_INVALID) {
      setInvalidToken(true);
    } else if (invitation) {
      setInvitation(invitation);
      setNeedsLogin(!global.isAuthenticated());
      if (global.isAuthenticated()) {
        acceptInvitation();
      }
    } else if (error) {
      global.setAppError(error);
    }
  }, [loaddedData, global]);

  const clearup = () => {
    setNeedsLogin(false);
    setInvalidToken(false);
    setInvitationAccepted(false);
  };

  const doNotAccept = () => {
    clearup();
    moveToLogout();
  };

  const doSignin = () => {
    setNeedsLogin(false);
    signin.open();
  };

  const doSignup = () => {
    setNeedsLogin(false);
    signup.open();
  };

  const signupDialogClose = signup.close;
  const signinDialogClose = signin.close;

  signup.close = () => {
    signupDialogClose();
    if (!global.isAuthenticated()) {
      setNeedsLogin(true);
    } else {
      acceptInvitation();
    }
  };

  signin.close = () => {
    signinDialogClose();
    if (!global.isAuthenticated()) {
      setNeedsLogin(true);
    } else {
      acceptInvitation();
    }
  };

  const closeInvitationAccepted = () => {
    clearup();
    navigate(`/topic/${invitation.id}`);
  };

  const acceptInvitation = () => {
    const validateEmail =
      invitation.invitation_email === global.getCurrentUser().email;
    postData('/api/member/accept', {
      token,
      validateEmail,
    })
      .then(({ ok, appError }) => {
        if (ok) {
          setInvitationAccepted(true);
        } else if (appError === INVITATION_TOKEN_INVALID) {
          setInvalidToken(true);
        }
      })
      .catch((e) => {
        global.setAppError(e.message);
      });
  };

  return (
    <Fragment>
      <Dialog open={needsLogin} scroll="body" fullWidth={true} maxWidth="sm">
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between' }}>
          Welcome to Hoally
        </DialogTitle>
        <DialogContent>
          Please sign up to Hoally or sign in to your existing account to get
          registered as a member of the {invitation.name} community for the
          property at {invitation.address}.
        </DialogContent>
        <DialogActions
          sx={{ display: 'flex', justifyContent: 'space-between' }}
        >
          <Button onClick={doNotAccept}>Cancel</Button>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
            <Button variant="outlined" onClick={doSignin}>
              Sign in
            </Button>
            <Button variant="contained" onClick={doSignup}>
              Sign up
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
      <SingupDialog
        control={signup}
        skipRedirect={true}
        defaultEmail={invitation.invitation_email}
      />
      <SinginDialog control={signin} skipRedirect={true} />
      <Snackbar
        anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
        open={invitationAccepted}
        onClose={closeInvitationAccepted}
      >
        <Alert onClose={closeInvitationAccepted} severity="success">
          You have been registered as a member of the {invitation.name}{' '}
          community for the property at {invitation.address}.
        </Alert>
      </Snackbar>
      <Snackbar
        anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
        open={invalidToken}
        onClose={doNotAccept}
      >
        <Alert onClose={doNotAccept} severity="error">
          The invitation link has expired. Please look at your email inbox for a
          more recent invitation of contact yout Hoally community admin.
        </Alert>
      </Snackbar>
    </Fragment>
  );
};

export default InvitationAccept;

export async function invitationLoader({ params: { token } }) {
  try {
    return await postData('/api/member/token', { token });
  } catch ({ message: error }) {
    return { error };
  }
}
