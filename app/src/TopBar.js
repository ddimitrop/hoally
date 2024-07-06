import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import Icon from '@mui/material/Icon';
import ListItemText from '@mui/material/ListItemText';

import { useState, Fragment, useContext } from 'react';
import { Global } from './Global';
import { getData } from './json-utils.js';
import { flagState } from './state-utils.js';

import './TopBar.css';
import './SignupDialog.js';
import SingupDialog from './SignupDialog';
import SinginDialog from './SigninDialog';

const TopBar = () => {
  const [drawerOpen, toggleDrawer] = useState(false);
  const signup = flagState(useState(false));
  const signin = flagState(useState(false));
  const global = useContext(Global);

  const logout = function () {
    getData('/api/hoauser/logout')
      .then((ok) => {
        if (ok) {
          global.setHoaUser({});
          global.setNeedsEmailValidation(false);
        }
      })
      .catch((e) => {
        global.setAppError(`Server error ${e.message}`);
      });
  };

  return (
    <Fragment>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={() => global.hoaUser.name && toggleDrawer(true)}
          >
            <MenuIcon />
          </IconButton>
          <Box
            component="div"
            sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}
          >
            <img className="AppLogo" alt="Logo" src="/logo192.png"></img>
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
      <Drawer open={drawerOpen} onClose={() => toggleDrawer(false)}>
        <Box
          sx={{
            width: 250,
            bgcolor: 'primary.contrastText',
            display: 'flex',
            height: '100%',
            flexDirection: 'row',
            alignItems: 'end',
          }}
          role="presentation"
          onClick={() => toggleDrawer(false)}
        >
          <Box role="presentation" sx={{ flexGrow: '1' }}>
            <List>
              <ListItem key={'Logout'} disablePadding>
                <ListItemButton onClick={() => logout()}>
                  <ListItemIcon>
                    <Icon> logout </Icon>
                  </ListItemIcon>
                  <ListItemText primary={'Logout'} />
                </ListItemButton>
              </ListItem>
            </List>
          </Box>
        </Box>
      </Drawer>
    </Fragment>
  );
};

export default TopBar;
