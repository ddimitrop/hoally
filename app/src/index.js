import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';
import App, { appLoader } from './App';
import ErrorPage from './ErrorPage';
import Content, { emailLoader } from './Content';
import GlobalContext from './Global';
import { StrictMode } from 'react';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    loader: appLoader,
    errorElement: <ErrorPage />,
    children: [
      {
        path: '',
        element: <Content />,
      },
      {
        path: 'validate-email/:token',
        element: <Content />,
        loader: emailLoader,
      },
    ],
  },
]);

const root = createRoot(document.getElementById('root'));
root.render(
  <GlobalContext>
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  </GlobalContext>,
);
