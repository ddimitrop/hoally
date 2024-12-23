import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import Divider from '@mui/material/Divider';
import Icon from '@mui/material/Icon';
import ListItemText from '@mui/material/ListItemText';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import SettingsDialog from './SettingsDialog';
import { getData } from './json-utils.js';
import { Global } from './Global';
import { useContext, useState, Fragment } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { flagState } from './state-utils.js';
import { useLogout } from './Navigate.js';

const AppDrawer = ({ control }) => {
  const global = useContext(Global);
  const settings = flagState(useState(false));
  const moveToLogout = useLogout();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const isTopic = location.pathname.startsWith('/topic');
  const isArchived = location.pathname.startsWith('/archived');

  const logout = function () {
    getData('/api/hoauser/logout')
      .then(({ ok }) => {
        if (ok) {
          global.loadHoaUser({});
          moveToLogout();
        }
      })
      .catch((e) => {
        global.setAppError(`Server error ${e.message}`);
      });
  };

  const goToCommunities = () => {
    navigate('/community');
  };

  const goToArchived = (range) => {
    navigate(`/archived/${params.communityId}/${range}`);
  };

  const goToOpen = () => {
    navigate(`/topic/${params.communityId}`);
  };

  return (
    <Fragment>
      <Drawer open={control.isOpen()} onClose={() => control.close()}>
        <Box
          sx={{
            width: 250,
            bgcolor: 'primary.contrastText',
            display: 'flex',
            height: '100%',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
          role="presentation"
          onClick={() => control.close()}
        >
          <Box role="presentation" sx={{ flexGrow: '1' }}>
            <List>
              <ListItem key={'Communities'} disablePadding>
                <ListItemButton onClick={goToCommunities}>
                  <ListItemIcon>
                    <Icon>holiday_village</Icon>
                  </ListItemIcon>
                  <ListItemText primary={'Communities'} />
                </ListItemButton>
              </ListItem>
              {isTopic ? (
                <Fragment>
                  <Divider />
                  <ListItem key={'Last 6 months'} disablePadding>
                    <ListItemButton onClick={() => goToArchived('recent')}>
                      <ListItemIcon>
                        <Icon>inventory</Icon>
                      </ListItemIcon>
                      <ListItemText primary={'Last 6 months'} />
                    </ListItemButton>
                  </ListItem>
                  <ListItem key={'All archived'} disablePadding>
                    <ListItemButton onClick={() => goToArchived('all')}>
                      <ListItemIcon>
                        <Icon>inventory</Icon>
                      </ListItemIcon>
                      <ListItemText primary={'All archived'} />
                    </ListItemButton>
                  </ListItem>
                </Fragment>
              ) : isArchived ? (
                <Fragment>
                  <Divider />
                  <ListItem key={'Open'} disablePadding>
                    <ListItemButton onClick={() => goToOpen()}>
                      <ListItemIcon>
                        <Icon>ballot</Icon>
                      </ListItemIcon>
                      <ListItemText primary={'Open'} />
                    </ListItemButton>
                  </ListItem>
                </Fragment>
              ) : (
                ''
              )}
            </List>
          </Box>

          <Box role="presentation">
            <List>
              <ListItem key={'Settings'} disablePadding>
                <ListItemButton onClick={() => settings.open()}>
                  <ListItemIcon>
                    <Icon> settings </Icon>
                  </ListItemIcon>
                  <ListItemText primary={'Account settings'} />
                </ListItemButton>
              </ListItem>
              <ListItem key={'Logout'} disablePadding>
                <ListItemButton onClick={() => logout()}>
                  <ListItemIcon>
                    <Icon> logout </Icon>
                  </ListItemIcon>
                  <ListItemText primary={'Logout'} />
                </ListItemButton>
              </ListItem>
            </List>
            <div className="documents-small">
              <a href="/privacy.html" target="_blank">
                Privacy policy
              </a>{' '}
              -
              <a href="/terms.html" target="_blank">
                Terms of use
              </a>
            </div>
          </Box>
        </Box>
      </Drawer>
      <SettingsDialog control={settings} />
    </Fragment>
  );
};

export default AppDrawer;
