import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';
import App, { appLoader } from './App';
import ErrorPage from './ErrorPage';
import ValidateEmail, { emailLoader } from './ValidateEmail';
import MarketingContent from './MarketingContent';
import RecoverAccount from './RecoverAccount';
import CommunityList, { communitiesLoader } from './CommunityList';
import CreateCommunity, { communityLoader } from './CreateCommunity';
import GlobalContext from './Global';
import { StrictMode } from 'react';
import { RequireAuth, DefaultLanding } from './Navigate';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    loader: appLoader,
    errorElement: <ErrorPage />,
    children: [
      {
        path: '',
        element: (
          <DefaultLanding>
            <MarketingContent />
          </DefaultLanding>
        ),
      },
      {
        path: 'validate-email/:token',
        element: <ValidateEmail />,
        loader: emailLoader,
      },
      {
        path: 'recover-account/:token',
        element: <RecoverAccount />,
      },
      {
        path: 'community',
        element: (
          <RequireAuth>
            <CommunityList />
          </RequireAuth>
        ),
        loader: communitiesLoader,
      },
      {
        path: 'community/create',
        element: (
          <RequireAuth>
            <CreateCommunity />
          </RequireAuth>
        ),
      },
      {
        path: 'community/:id',
        element: (
          <RequireAuth>
            <CreateCommunity />
          </RequireAuth>
        ),
        loader: communityLoader,
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
