import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import { Global } from './Global.js';
import { useLoaderData, useNavigate } from 'react-router-dom';
import { useState, useContext } from 'react';
import { getData } from './json-utils.js';
import ConfirmDialog from './ConfirmDialog.js';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import { flagState, changeProtect } from './state-utils.js';
import TopicContent from './TopicContent.js';
import { useDefaultNavigate } from './Navigate.js';
import './Markdown.css';
import { NO_AUTHENTICATION_COOKIE } from './errors.mjs';

const ViewTopic = () => {
  const global = useContext(Global);
  const navigate = useNavigate();
  const defaultNavigate = useDefaultNavigate();
  const archiveDialog = flagState(useState(false));
  const cancelDialog = flagState(useState(false));
  const [hasRedirect, setHasRedirect] = useState(false);
  const protect = changeProtect(
    useState(false),
    useState(),
    useState(),
    cancelDialog,
  );

  const editTopic = (id) => {
    protect.checkChange(() => {
      navigate(`/topic/${community.id}/edit/${id}`);
    });
  };

  const data = useLoaderData();

  let { community, member, topic } = data;
  let errorMessage = data.error;
  if (!community) community = {};
  if (!member) member = {};
  if (!topic) topic = { proposition: [], tags: [], images: [] };
  for (const part of [community, member, topic]) {
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
            defaultNavigate();
          });
        }
      }, 0);
    }
    community = {};
    member = {};
    topic = { proposition: [], tags: [], images: [] };
  }

  const confirmArchive = () => {
    protect.checkChange(() => {
      archiveDialog.open();
    });
  };

  const backToList = () => {
    protect.checkChange(() => {
      goBack();
    });
  };

  const goBack = () => {
    if (topic.is_open) {
      navigate(`/topic/${community.id}`);
    } else {
      navigate(`/archived/${community.id}/recent`);
    }
  };

  const cannotEdit = (topic) => {
    if (topic.member_id !== member.id || !topic.member_id) return true;
    if (!topic.is_open) return true;
    if (member.is_moderator) return false;
    if (
      Date.now() - new Date(topic.creation_timestamp) >
      // Edit is not allowed after 1 day.
      1000 * 60 * 60 * 24 * 1
    )
      return true;
    return topic.propositions?.some(
      (p) => p.votes_up !== 0 || p.votes_down !== 0 || p.comments.length !== 0,
    );
  };

  const canArchive = (topic) => {
    if (!topic.id) return false;
    if (!topic.is_open) return false;
    if (topic.member_id === member.id) return true;
    if (member.is_board_member) {
      return (
        // Board members can archive all posts that are 7 days old.
        Date.now() - new Date(topic.creation_timestamp) >
        1000 * 60 * 60 * 24 * 7
      );
    }
    return false;
  };

  return (
    <Stack sx={{ maxWidth: '800px' }}>
      <div
        style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'space-between',
        }}
      >
        <Button
          edge="end"
          size="small"
          variant="outlined"
          aria-label="done"
          onClick={backToList}
        >
          Back
        </Button>

        {cannotEdit(topic) ? (
          <Tooltip
            title="Archiving this topic will freeze it and 
                             move it to the historical views. 
                             Board members can also archive your older (7 days) posts ."
          >
            <Button
              sx={{
                visibility: canArchive(topic) ? 'visible' : 'hidden',
              }}
              edge="end"
              size="small"
              variant="contained"
              color="error"
              aria-label="archive"
              onClick={() => confirmArchive()}
            >
              Archive
            </Button>
          </Tooltip>
        ) : (
          <Tooltip
            title="Editing this topic is only allowed very early, 
                                    before others have voted or commented on it."
          >
            <Button
              sx={{
                visibility:
                  member.id === topic.member_id ? 'visible' : 'hidden',
              }}
              edge="end"
              size="small"
              variant="contained"
              aria-label="edit"
              onClick={() => editTopic(topic.id)}
            >
              Edit
            </Button>
          </Tooltip>
        )}
      </div>
      <List
        dense
        disablePadding
        sx={{
          flexGrow: '1',
          marginTop: '16px',
        }}
      >
        <ListItem
          key={topic.id}
          sx={{ paddingBottom: '10px' }}
          secondaryAction={
            <Stack
              direction="column"
              sx={{ height: '80px' }}
              justifyContent="space-between"
            ></Stack>
          }
        >
          <TopicContent
            topic={topic}
            member={member}
            community={community}
            summary={false}
            protect={protect}
          ></TopicContent>
        </ListItem>
      </List>
      <ConfirmDialog
        control={cancelDialog}
        onConfirm={protect.onConfirm}
        title="Discard changes"
        text="Are you sure you want to discard your changes?"
        action="Yes"
      />
      <DeleteConfirmDialog
        control={archiveDialog}
        onDelete={goBack}
        deleteApiPath={`/api/topic/${topic.id}/archive`}
        deleteMethod="POST"
        deleteTitle="Archive topic ?"
        deleteText="The topic will be transfered to the archived topics and votes or comments will be frozen."
        deleteAction="Archive"
      />
    </Stack>
  );
};

export async function viewTopicLoader({ params: { communityId, topicId } }) {
  try {
    const community = await getData(`/api/community/${communityId}`);
    const member = await getData(`/api/member/user/${communityId}`);
    const topic = await getData(`/api/topic/${communityId}/${topicId}`);
    return { community, member, topic };
  } catch ({ message: error }) {
    return { error };
  }
}

export default ViewTopic;
