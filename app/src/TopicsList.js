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
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
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
import { getData, postData } from './json-utils.js';
import AddTopic from './AddTopic.js';
import { red } from '@mui/material/colors';
import { green } from '@mui/material/colors';
import ConfirmDialog from './ConfirmDialog.js';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import { flagState } from './state-utils.js';
import { useTheme } from '@mui/material/styles';
import CommentsList from './CommentsList';

const TopicsList = () => {
  const global = useContext(Global);
  const theme = useTheme();
  let [topicAdd, setTopicAdd] = useState(false);
  let [topicEdit, setTopicEdit] = useState(null);
  let [deleteIndex, setDeleteIndex] = useState(null);
  const deleteDialog = flagState(useState(false));
  let [archiveIndex, setArchiveIndex] = useState(null);
  const archiveDialog = flagState(useState(false));
  let [topicChanged, setTopicChanged] = useState(false);
  let [onCancel, setOnCancel] = useState({ callback: () => {} });
  const cancelDialog = flagState(useState(false));
  let [voteCount, setVoteCount] = useState(0);
  const [commentCancel, setCommentCancel] = useState(null);

  const voteUpColor = green[800];
  const voteDownColor = red[800];
  const likeColor = red[700];
  const noVoteColor = theme.palette.grey[600];

  const checkChange = (callback) => {
    if (topicChanged) {
      setOnCancel({ callback });
      cancelDialog.open();
    } else {
      clearEdits();
      callback();
    }
  };

  const clearEdits = () => {
    setTopicEdit(null);
    setTopicAdd(false);
    setTopicChanged(false);
    commentCancel?.callback();
    setCommentCancel(null);
  };

  const cancelTopic = () => {
    clearEdits();
    cancelDialog.close();
    onCancel.callback();
  };

  const postTopic = () => {
    checkChange(() => {
      setTopicAdd(true);
    });
  };

  const editDone = (topic, isNew) => {
    if (topic) {
      if (isNew) {
        topicsList.push(topic);
      }
    }
    clearEdits();
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
    topic.tags.length ? topic.tags.map((tag) => `#${tag}`).join(', ') : '';

  const editTopic = (i) => {
    checkChange(() => {
      setTimeout(() => setTopicEdit(i), 0);
    });
  };

  const confirmDelete = (i) => {
    checkChange(() => {
      // We show the list in reverse.
      setDeleteIndex(topicsList.length - 1 - i);
      deleteDialog.open();
    });
  };

  const deleteTopic = () => {
    topicsList.splice(deleteIndex, 1);
    setDeleteIndex(null);
  };

  const confirmArchive = (i) => {
    checkChange(() => {
      // We show the list in reverse.
      setArchiveIndex(topicsList.length - 1 - i);
      archiveDialog.open();
    });
  };

  const archiveTopic = () => {
    topicsList.splice(archiveIndex, 1);
    setArchiveIndex(null);
  };

  const loveTopic = (topic) => {
    vote(topic, topic.propositions[0], true);
  };

  const vote = (topic, proposition, vote) => {
    checkChange(() => {
      if (proposition.vote === vote) {
        vote = null;
      }
      postData(`/api/topic/${topic.id}/vote/${proposition.id}`, {
        vote,
      })
        .then(() => {
          if (proposition.vote === true) {
            proposition.votes_up--;
          } else if (proposition.vote === false) {
            proposition.votes_down--;
          }
          proposition.vote = vote;
          if (vote === true) {
            proposition.votes_up++;
          } else if (vote === false) {
            proposition.votes_down++;
          }
          setVoteCount(voteCount + 1);
        })
        .catch(({ message }) => {
          global.setAppError(message);
        });
    });
  };

  const hasVotes = (topic) =>
    topic.propositions.some((p) => p.votes_up !== 0 || p.votes_down !== 0);

  return (
    <Stack>
      <Stack direction="row" justifyContent="space-between">
        <TextField
          id="outlined-basic"
          label="Search posts"
          variant="outlined"
          size="small"
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
          <Stack direction="row" justifyContent="start">
            <AddTopic
              done={editDone}
              topic={{ type: 'proposition' }}
              member={member}
              setChanged={setTopicChanged}
            />
          </Stack>
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
                    onClick={() => confirmArchive(i)}
                  >
                    <ArchiveOutlinedIcon />
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
                          {topic.description}
                          <br></br>
                          {topicTags(topic)}
                          {topic.type === 'announcement' ? (
                            <CommentsList
                              checkChange={checkChange}
                              setChanged={setTopicChanged}
                              setCommentCancel={setCommentCancel}
                              comments={topic.propositions[0].comments}
                              topicId={topic.id}
                              propositionId={topic.propositions[0].id}
                            />
                          ) : (
                            ''
                          )}
                        </Grid>
                        {topic.type === 'announcement' ? (
                          <Grid item xs={3} sx={{ whiteSpace: 'nowrap' }}>
                            <IconButton
                              size="small"
                              onClick={() => loveTopic(topic)}
                              aria-label="love"
                            >
                              <FavoriteIcon
                                sx={{
                                  color: topic.propositions[0].vote
                                    ? likeColor
                                    : noVoteColor,
                                }}
                                fontSize="small"
                              />
                            </IconButton>
                            <span style={{ fontSize: '14px' }}>
                              ({topic.propositions[0].votes_up})
                            </span>
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
                    ? topic.propositions.map((proposition, j) => (
                        <Box key={proposition.id}>
                          <Grid container>
                            <Grid item xs={9}>
                              <b>Proposition:</b> {proposition.description}
                              <CommentsList
                                checkChange={checkChange}
                                setChanged={setTopicChanged}
                                setCommentCancel={setCommentCancel}
                                comments={proposition.comments}
                                topicId={topic.id}
                                propositionId={proposition.id}
                              />
                            </Grid>
                            <Grid item xs={3}>
                              <span style={{ whiteSpace: 'nowrap' }}>
                                <IconButton
                                  size="small"
                                  onClick={() => vote(topic, proposition, true)}
                                  aria-label="vote up"
                                >
                                  <ThumbUpOffAltIcon
                                    sx={{
                                      color:
                                        proposition.vote === true
                                          ? voteUpColor
                                          : noVoteColor,
                                    }}
                                    fontSize="small"
                                  />
                                </IconButton>
                                <span style={{ fontSize: '14px' }}>
                                  ({proposition.votes_up})
                                </span>
                              </span>
                              <span style={{ whiteSpace: 'nowrap' }}>
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    vote(topic, proposition, false)
                                  }
                                  aria-label="vote down"
                                >
                                  <ThumbDownOffAltIcon
                                    sx={{
                                      color:
                                        proposition.vote === false
                                          ? voteDownColor
                                          : noVoteColor,
                                    }}
                                    fontSize="small"
                                  />
                                </IconButton>
                                <span style={{ fontSize: '14px' }}>
                                  {proposition.votes_down})
                                </span>
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
      <DeleteConfirmDialog
        control={archiveDialog}
        onDelete={() => {
          archiveTopic();
        }}
        deleteApiPath={`/api/topic/${topicsList[archiveIndex]?.id}/archive`}
        deleteMethod="POST"
        deleteTitle="Archive topic ?"
        deleteText="The topic will be transfered to the archived topics and votes or comments will be frozen."
        deleteAction="Archive"
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
