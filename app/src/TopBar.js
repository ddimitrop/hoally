import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';

import { useState, Fragment, useContext } from 'react';
import { Global } from './Global';
import { flagState } from './state-utils.js';

import './SignupDialog.js';
import SingupDialog from './SignupDialog';
import SinginDialog from './SigninDialog';
import AppLogo from './AppLogo';
import AppDrawer from './AppDrawer';
import ValidationWarning from './ValidationWarning';

const TopBar = () => {
  const signup = flagState(useState(false));
  const signin = flagState(useState(false));
  const drawer = flagState(useState(false));

  const global = useContext(Global);

  return (
    <Fragment>
      <AppBar position="sticky">
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ marginRight: '4px' }}
            onClick={() => global.hoaUser.name && drawer.open()}
          >
            <MenuIcon />
          </IconButton>
          <Box
            component="div"
            sx={{ flexGrow: 1, display: 'flex', alignItems: 'start' }}
          >
            <AppLogo
              sx={{ width: '36px', height: '36px', marginRight: '16px' }}
            />
            <Typography variant="logo">HOAlly</Typography>
          </Box>
          {global.hoaUser.name ? null : (
            <Fragment>
              <Button
                color="inherit"
                onClick={() => {
                  signup.open();
                }}
              >
                Sign up
              </Button>
              <Button
                color="inherit"
                onClick={() => {
                  signin.open();
                }}
              >
                Sign in
              </Button>
            </Fragment>
          )}
        </Toolbar>
      </AppBar>
      <SingupDialog control={signup} />
      <SinginDialog control={signin} />
      <AppDrawer control={drawer} />
      <ValidationWarning />
    </Fragment>
  );
};

export default TopBar;
