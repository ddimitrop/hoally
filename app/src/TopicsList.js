import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import PostAddIcon from '@mui/icons-material/PostAdd';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt';
import ThumbDownOffAltIcon from '@mui/icons-material/ThumbDownOffAlt';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ArchiveIcon from '@mui/icons-material/Archive';
import BallotIcon from '@mui/icons-material/Ballot';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { Global } from './Global.js';
import { useLoaderData } from 'react-router-dom';
import { useState, useContext, Fragment } from 'react';
import Divider from '@mui/material/Divider';
import { getData } from './json-utils.js';
import AddTopic from './AddTopic.js';
import { red } from '@mui/material/colors';
import { amber } from '@mui/material/colors';
import ConfirmDialog from './ConfirmDialog.js';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import { flagState } from './state-utils.js';

const TopicsList = () => {
  const global = useContext(Global);
  let [topicAdd, setTopicAdd] = useState(false);
  let [topicEdit, setTopicEdit] = useState(null);
  let [deleteIndex, setDeleteIndex] = useState(null);
  const deleteDialog = flagState(useState(false));
  let [topicChanged, setTopicChanged] = useState(false);
  let [onCancel, setOnCancel] = useState({ callback: () => {} });
  const cancelDialog = flagState(useState(false));

  const checkChange = (callback) => {
    if (topicChanged) {
      setOnCancel({ callback });
      cancelDialog.open();
    } else {
      callback();
    }
  };

  const cancelTopic = () => {
    editDone();
    cancelDialog.close();
    onCancel.callback();
  };

  const postTopic = () => {
    checkChange(() => {
      setTopicEdit(null);
      setTopicAdd(true);
    });
  };

  const editDone = (topic, isNew) => {
    if (topic) {
      if (isNew) {
        topicsList.push(topic);
      }
    }
    setTopicAdd(false);
    setTopicEdit(null);
    setTopicChanged(false);
  };

  const data = useLoaderData();
  const { error } = data;
  if (error) {
    global.setAppError(error);
  }

  const member = data.member || {};
  const { error: memberError } = member;
  if (memberError) {
    global.setAppError(memberError);
  }

  const topicsList = data.topics || [];
  const { error: topicsError } = topicsList;
  if (topicsError) {
    global.setAppError(topicsError);
  }

  const topicTags = (topic) =>
    topic.tags.length
      ? ' - ' + topic.tags.map((tag) => `#${tag}`).join(', ')
      : '';

  const editTopic = (i) => {
    checkChange(() => {
      setTopicEdit(i);
      setTopicAdd(false);
    });
  };

  const confirmDelete = (i) => {
    // We show the list in reverse.
    setDeleteIndex(topicsList.length - 1 - i);
    deleteDialog.open();
  };
  const deleteTopic = () => {
    topicsList.splice(deleteIndex, 1);
    setDeleteIndex(null);
  };
  const archiveTopic = () => {};
  const loveTopic = () => {};
  const voteUp = () => {};
  const voteDown = () => {};
  const hasVotes = (topic) => false;

  return (
    <Stack spacing={1}>
      <Stack direction="row" justifyContent="space-between">
        <TextField
          id="outlined-basic"
          label="Search posts"
          variant="outlined"
          sx={{ flexGrow: 1, maxWidth: 'md', paddingRight: '8px' }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'end' }}>
          <Fab color="primary" variant="extended" onClick={postTopic}>
            <PostAddIcon sx={{ mr: 1 }} />
            <Box sx={{ whiteSpace: 'nowrap' }}>New post</Box>
          </Fab>
        </Box>
      </Stack>
      {topicAdd ? (
        <Fragment>
          <Divider />
          <Stack
            direction="row"
            justifyContent="start"
            sx={{ paddingTop: '16px' }}
          >
            <AddTopic
              done={editDone}
              topic={{ type: 'proposition' }}
              member={member}
              setChanged={setTopicChanged}
            />
          </Stack>
          <Divider />
        </Fragment>
      ) : (
        ''
      )}
      {!topicsList.length && !topicAdd ? (
        <Box
          sx={{
            paddingTop: '16px',
            fontSize: '18px',
            opacity: '0.5',
            textAlign: 'center',
          }}
        >
          No topics posted yet
        </Box>
      ) : (
        ''
      )}
      <List dense disablePadding sx={{ flexGrow: '1' }}>
        {[...topicsList].reverse().map((topic, i) =>
          topicEdit === i ? (
            <ListItem key={member.id}>
              <AddTopic
                done={editDone}
                topic={topic}
                member={member}
                setChanged={setTopicChanged}
              />
            </ListItem>
          ) : (
            <ListItem
              key={topic.id}
              divider
              secondaryAction={
                hasVotes(topic) ? (
                  <IconButton
                    edge="end"
                    aria-label="archive"
                    onClick={() => archiveTopic(topic.id)}
                  >
                    <ArchiveIcon />
                  </IconButton>
                ) : (
                  <Fragment>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => confirmDelete(i)}
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="edit"
                      onClick={() => editTopic(i)}
                    >
                      <EditOutlinedIcon />
                    </IconButton>
                  </Fragment>
                )
              }
            >
              <Stack sx={{ width: '100%' }}>
                <Stack direction="row" alignItems="center">
                  <ListItemIcon>
                    {topic.type === 'proposition' ? (
                      <BallotIcon fontSize="large" />
                    ) : (
                      <AnnouncementIcon fontSize="large" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    disableTypography
                    sx={{
                      marginRight: '24px',
                    }}
                    primary={topic.subject}
                    secondary={
                      <Grid container>
                        <Grid
                          item
                          sx={{ fontSize: '14px' }}
                          xs={topic.type === 'announcement' ? 9 : 12}
                        >
                          {topic.description + topicTags(topic)}
                        </Grid>
                        {topic.type === 'announcement' ? (
                          <Grid item xs={3} sx={{ whiteSpace: 'nowrap' }}>
                            <IconButton
                              size="small"
                              onClick={() => loveTopic(topic)}
                              aria-label="love"
                            >
                              <FavoriteIcon fontSize="small" />
                            </IconButton>
                            <span style={{ fontSize: '14px' }}>(6)</span>
                          </Grid>
                        ) : (
                          ''
                        )}
                      </Grid>
                    }
                  />
                </Stack>
                <Box
                  sx={{
                    marginRight: '24px',
                    marginLeft: '54px',
                  }}
                >
                  {topic.type === 'proposition'
                    ? topic.propositions.map((proposition) => (
                        <Box key={proposition.id}>
                          <Grid container>
                            <Grid item xs={9}>
                              <b>Proposition:</b> {proposition.description}
                            </Grid>
                            <Grid item xs={3}>
                              <span style={{ whiteSpace: 'nowrap' }}>
                                <IconButton
                                  size="small"
                                  onClick={() => voteUp(proposition)}
                                  aria-label="vote up"
                                >
                                  <ThumbUpOffAltIcon fontSize="small" />
                                </IconButton>
                                <span style={{ fontSize: '14px' }}>(8)</span>
                              </span>
                              <span style={{ whiteSpace: 'nowrap' }}>
                                <IconButton
                                  size="small"
                                  onClick={() => voteDown(proposition)}
                                  aria-label="vote down"
                                >
                                  <ThumbDownOffAltIcon fontSize="small" />
                                </IconButton>
                                <span style={{ fontSize: '14px' }}>(5)</span>
                              </span>
                            </Grid>
                          </Grid>
                        </Box>
                      ))
                    : ''}
                </Box>
              </Stack>
            </ListItem>
          ),
        )}
      </List>
      <ConfirmDialog
        control={cancelDialog}
        onConfirm={cancelTopic}
        title="Discard changes"
        text="Are you sure you want to discard your changes?"
        action="Yes"
      />
      <DeleteConfirmDialog
        control={deleteDialog}
        onDelete={() => {
          deleteTopic();
        }}
        deleteApiPath={`/api/topic/${topicsList[deleteIndex]?.id}`}
        deleteTitle="Delete topic ?"
        deleteText="Deleting the topic can't be undone."
      />
    </Stack>
  );
};

export async function topicsLoader({ params: { communityId } }) {
  try {
    const member = await getData(`/api/member/user/${communityId}`);
    const topics = await getData(`/api/topic/${communityId}`);
    return { member, topics };
  } catch ({ message: error }) {
    return { error };
  }
}

export default TopicsList;
