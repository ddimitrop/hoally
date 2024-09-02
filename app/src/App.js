import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import Box from '@mui/material/Box';
import TopBar from './TopBar';
import GlobalSnackBar from './GlobalSnackBar';
import { Global } from './Global';
import { getData } from './json-utils.js';
import { useContext, useEffect } from 'react';
import { Outlet, useLoaderData } from 'react-router-dom';
import { useDefaultNavigate } from './Navigate.js';

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
      light: '#7dfe01',
      main: '#408004',
      dark: '#1e3b02',
      contrastText: '#212121',
    },
  },
});

let hoaUserLoaded = false;

export default function App() {
  const global = useContext(Global);
  const defaultNavigate = useDefaultNavigate();

  // Load the signed in cookie (using the authcookie if exists), when there is
  // not a user yet.
  const { hoaUser, error } = useLoaderData();
  useEffect(() => {
    if (!hoaUserLoaded) return;
    hoaUserLoaded = false;
    if (error) {
      global.setAppError(`Server error ${error}`);
    } else if (hoaUser) {
      global.loadHoaUser(hoaUser);
    }
    // We just ignore appErrors like no/invalid auth cookie
    defaultNavigate();
  });

  return (
    <Global.Provider value={global}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box className="App" sx={{ flexGrow: 1 }}>
          <TopBar />
          <Outlet />
          <GlobalSnackBar />
        </Box>
      </ThemeProvider>
    </Global.Provider>
  );
}

export async function appLoader({ params }) {
  hoaUserLoaded = true;
  try {
    return await getData('/api/hoauser');
  } catch ({ message: error }) {
    return { error };
  }
}
