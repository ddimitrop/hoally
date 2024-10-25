import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import PostAddIcon from '@mui/icons-material/PostAdd';
import HolidayVillageOutlinedIcon from '@mui/icons-material/HolidayVillageOutlined';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import { Global } from './Global.js';
import { useLoaderData, useNavigate } from 'react-router-dom';
import { useState, useContext } from 'react';
import { getData } from './json-utils.js';
import TopicContent from './TopicContent.js';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import './Markdown.css';
import { NO_AUTHENTICATION_COOKIE } from './errors.mjs';

const TopicsList = () => {
  const global = useContext(Global);
  const purify = DOMPurify(window);
  const navigate = useNavigate();
  const [hasRedirect, setHasRedirect] = useState(false);

  const isHiddenIntro = () => {
    return Date.now() < Number(localStorage.getItem('hiddenIntro'));
  };

  const hideIntroFormSecs = (secs) => {
    localStorage.setItem('hiddenIntro', Date.now() + secs * 1000);
  };

  const [hiddenIntro, setHiddenIntro] = useState(isHiddenIntro());

  const postTopic = () => {
    navigate(`/topic/${community.id}/edit/new`);
  };

  const data = useLoaderData();

  let { community, member, topics } = data;
  let errorMessage = data.error;
  if (!community) community = {};
  if (!member) member = {};
  if (!topics) topics = [];
  for (const part of [community, member, topics]) {
    const { error, appError } = part;
    errorMessage ||= error || appError;
  }
  if (errorMessage) {
    if (errorMessage !== NO_AUTHENTICATION_COOKIE) {
      setTimeout(() => {
        if (!hasRedirect) {
          setHasRedirect(true);
          global.setAppError(errorMessage);
          global.customErrorClose(() => {
            navigate('/community');
          });
        }
      }, 0);
    }
    community = {};
    member = {};
    topics = [];
  }

  const getIntro = () => {
    if (!community.intro) return '';
    const intro = community.intro.replace('<community_name>', community.name);
    const markedHtml = marked.parse(intro);
    return purify.sanitize(markedHtml);
  };

  const hideIntro = () => {
    hideIntroFormSecs(60 * 60 * 24 * 356);
    setHiddenIntro(true);
  };

  return (
    <Stack sx={{ maxWidth: '800px' }}>
      {!hiddenIntro && community.intro ? (
        <Alert
          sx={{ marginBottom: '16px', maxHeight: '200px' }}
          icon={<HolidayVillageOutlinedIcon fontSize="inherit" />}
          severity="success"
          onClose={hideIntro}
        >
          <div
            className="markdown"
            dangerouslySetInnerHTML={{ __html: getIntro() }}
          ></div>
        </Alert>
      ) : (
        ''
      )}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div />
        {community.id ? (
          <Fab color="primary" variant="extended" onClick={postTopic}>
            <PostAddIcon sx={{ mr: 1 }} />
            <Box sx={{ whiteSpace: 'nowrap' }}>New post</Box>
          </Fab>
        ) : (
          ''
        )}
      </Box>
      {!topics.length ? (
        <Box
          sx={{
            paddingTop: '64px',
            fontSize: '18px',
            opacity: '0.5',
            textAlign: 'center',
          }}
        >
          No topics posted yet
        </Box>
      ) : (
        <List
          dense
          disablePadding
          sx={{
            flexGrow: '1',
            borderTop: 'solid 1px rgba(0,0,0, 0.12)',
            marginTop: '16px',
          }}
        >
          {[...topics].reverse().map((topic, i) => (
            <ListItem key={topic.id} divider sx={{ paddingBottom: '10px' }}>
              <TopicContent
                topic={topic}
                member={member}
                community={community}
                summary={true}
              ></TopicContent>
            </ListItem>
          ))}
        </List>
      )}
    </Stack>
  );
};

export async function topicsLoader({ params: { communityId } }) {
  try {
    const community = await getData(`/api/community/${communityId}`);
    const member = await getData(`/api/member/user/${communityId}`);
    const topics = await getData(`/api/topic/${communityId}`);
    return { community, member, topics };
  } catch ({ message: error }) {
    return { error };
  }
}

export default TopicsList;
