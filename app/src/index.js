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
import TopicsList, { topicsLoader } from './TopicsList';
import EditTopic, { editTopicLoader } from './EditTopic';
import ViewTopic, { viewTopicLoader } from './ViewTopic';
import InvitationAccept, { invitationLoader } from './InvitationAccept';
import InvitationReject, { rejectLoader } from './InvitationReject';
import GlobalContext from './Global';
import { StrictMode } from 'react';
import { RequireAuth, DefaultLanding } from './Navigate';
import { getData } from './json-utils';

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
        path: 'invitation/:token',
        element: <InvitationAccept />,
        loader: invitationLoader,
      },
      {
        path: 'unregister/:token',
        element: <InvitationReject />,
        loader: rejectLoader,
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
        path: 'community/:communityId',
        element: (
          <RequireAuth>
            <CreateCommunity />
          </RequireAuth>
        ),
        loader: communityLoader,
      },
      {
        path: 'topic/:communityId',
        element: (
          <RequireAuth>
            <TopicsList />
          </RequireAuth>
        ),
        loader: topicsLoader,
      },
      {
        path: 'archived/:communityId/:range',
        element: (
          <RequireAuth>
            <TopicsList />
          </RequireAuth>
        ),
        loader: topicsLoader,
      },
      {
        path: 'topic/:communityId/edit/:topicId/',
        element: (
          <RequireAuth>
            <EditTopic />
          </RequireAuth>
        ),
        loader: editTopicLoader,
      },
      {
        path: 'topic/:communityId/view/:topicId/',
        element: (
          <RequireAuth>
            <ViewTopic />
          </RequireAuth>
        ),
        loader: viewTopicLoader,
      },
    ],
  },
]);

getData('/api/flags').then(({ flags }) => {
  window.getFlag = (key) => flags[key];

  const root = createRoot(document.getElementById('root'));
  root.render(
    <GlobalContext>
      <StrictMode>
        <RouterProvider router={router} />
      </StrictMode>
    </GlobalContext>,
  );
});
