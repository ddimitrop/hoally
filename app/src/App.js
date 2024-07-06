import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import Box from '@mui/material/Box';
import TopBar from './TopBar';
import GlobalSnackBar from './GlobalSnackBar';
import { Global } from './Global';
import { getData } from './json-utils.js';
import { useContext, useEffect } from 'react';
import { Outlet, useLoaderData } from 'react-router-dom';

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

export default function App() {
  const global = useContext(Global);

  // Load the signed in cookie (using the authcookie if exists), when there is
  // not a user yet.
  const { hoaUser, error } = useLoaderData();
  useEffect(() => {
    if (error) {
      global.setAppError(`Server error ${error}`);
    } else if (hoaUser) {
      if (!hoaUser.email_validated) {
        global.setNeedsEmailValidation(true);
      }
      global.setHoaUser(hoaUser);
    }
  });

  return (
    <Global.Provider value={global}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box className="App" sx={{ flexGrow: 1 }}>
          <TopBar />
          <Outlet />
          <GlobalSnackBar />;
        </Box>
      </ThemeProvider>
    </Global.Provider>
  );
}

export async function appLoader() {
  try {
    const hoaUser = await getData('/api/hoauser');
    return { hoaUser };
  } catch (e) {
    return { error: e.message };
  }
}
