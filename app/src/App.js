import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import Box from '@mui/material/Box';
import TopBar from './TopBar.js';
import Content from './Content.js';
import GlobalSnackBar from './GlobalSnackBar.js';
import { global, Global } from './Global.js';
import { getData } from './json-utils.js';
import { useState } from 'react';
import { valueState } from './state-utils.js';

const theme = createTheme({
  typography: {
    fontFamily: 'Quicksand, Arial',
    logo: {
      fontFamily: '"Amita", serif',
      fontSize: '30px',
    },
  },
  palette: {
    primary: {
      light: '#3e4b50',
      main: '#0e1e25',
      dark: '#091519',
      contrastText: '#f5f5f5',
    },
    secondary: {
      light: '#9acdca',
      main: '#81c1bd',
      dark: '#5a8784',
      contrastText: '#212121',
    },
  },
});

function App() {
  // Add the hoaUser in global state.
  global.addState(useState({}), 'hoaUser');
  global.addState(useState(''), 'appError');

  if (!global.hoaUserPending) {
    global.hoaUserPending = true;
    // Load the signed in cookie (using the authcookie if exists), when there is
    // not a user yet.
    getData('/api/hoauser')
      .then((hoaUser) => {
        if (hoaUser) {
          global.setHoaUser(hoaUser);
        }
      })
      .catch((e) => {
        global.setAppError(`Server error ${e.message}`);
      });
  }

  return (
    <Global.Provider value={global}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box className="App" sx={{ flexGrow: 1 }}>
          <TopBar />
          <Content />
          <GlobalSnackBar error="appError" />;
        </Box>
      </ThemeProvider>
    </Global.Provider>
  );
}

export default App;
