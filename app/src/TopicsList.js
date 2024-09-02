import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import PostAddIcon from '@mui/icons-material/PostAdd';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt';
import ThumbDownOffAltIcon from '@mui/icons-material/ThumbDownOffAlt';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import FavoriteIcon from '@mui/icons-material/Favorite';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import HolidayVillageOutlinedIcon from '@mui/icons-material/HolidayVillageOutlined';
import BallotIcon from '@mui/icons-material/Ballot';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { Global } from './Global.js';
import { useLoaderData } from 'react-router-dom';
import { useState, useContext, Fragment, dangerouslySetInnerHTML } from 'react';
import { getData, postData, longAgo } from './json-utils.js';
import AddTopic from './AddTopic.js';
import { red } from '@mui/material/colors';
import { green } from '@mui/material/colors';
import ConfirmDialog from './ConfirmDialog.js';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import { flagState } from './state-utils.js';
import { useTheme } from '@mui/material/styles';
import CommentsList from './CommentsList';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import './Markdown.css';

const TopicsList = () => {
  const global = useContext(Global);
  const purify = DOMPurify(window);
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
  const [expanded, setExpanded] = useState([]);
  const [needsExpand, setNeedsExpand] = useState([]);

  const isHiddenIntro = () => {
    return Date.now() < Number(localStorage.getItem('hiddenIntro'));
  };

  const hideIntroFormSecs = (secs) => {
    localStorage.setItem('hiddenIntro', Date.now() + secs * 1000);
  };

  const [hiddenIntro, setHiddenIntro] = useState(isHiddenIntro());

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

  const community = data.community || {};
  const { error: communityError } = community;
  if (communityError) {
    global.setAppError(communityError);
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
        .then(({ votes }) => {
          votes = Number(votes);
          proposition.votes_up = Number(proposition.votes_up);
          proposition.votes_down = Number(proposition.votes_down);
          if (proposition.vote === true) {
            proposition.votes_up -= votes;
          } else if (proposition.vote === false) {
            proposition.votes_down -= votes;
          }
          proposition.vote = vote;
          if (vote === true) {
            proposition.votes_up += votes;
          } else if (vote === false) {
            proposition.votes_down += votes;
          }
          setVoteCount(voteCount + 1);
        })
        .catch(({ message }) => {
          global.setAppError(message);
        });
    });
  };

  const getIntro = () => {
    if (!community.intro) return '';
    const intro = community.intro.replace('<community_name>', community.name);
    const markedHtml = marked.parse(intro);
    return purify.sanitize(markedHtml);
  };

  const hideIntro = () => {
    hideIntroFormSecs(60 * 60 * 24);
    setHiddenIntro(true);
  };

  const toggleExpand = (i) => {
    expanded[i] = !expanded[i];
    setExpanded([...expanded]);
  };

  const cannotEdit = (topic) => {
    if (topic.member_id !== member.id) return true;
    return topic.propositions.some(
      (p) => p.votes_up !== 0 || p.votes_down !== 0 || p.comments.length !== 0,
    );
  };

  const canArchive = (topic) => {
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
    <Stack>
      {!hiddenIntro ? (
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
        {false ? (
          <TextField
            id="outlined-basic"
            label="Search posts"
            variant="outlined"
            size="small"
            sx={{ flexGrow: 1, maxWidth: 'md', paddingRight: '8px' }}
          />
        ) : (
          <div />
        )}
        <Fab color="primary" variant="extended" onClick={postTopic}>
          <PostAddIcon sx={{ mr: 1 }} />
          <Box sx={{ whiteSpace: 'nowrap' }}>New post</Box>
        </Fab>
      </Box>
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
            paddingTop: '64px',
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
      <List
        dense
        disablePadding
        sx={{
          flexGrow: '1',
          borderTop: 'solid 1px rgba(0,0,0, 0.12)',
          marginTop: '16px',
        }}
      >
        {[...topicsList].reverse().map((topic, i) =>
          topicEdit === i ? (
            <ListItem key={member.id} divider sx={{ paddingBottom: '16px' }}>
              <AddTopic
                done={editDone}
                topic={topic}
                member={member}
                setChanged={setTopicChanged}
                confirmDelete={() => confirmDelete(i)}
              />
            </ListItem>
          ) : (
            <ListItem
              key={topic.id}
              divider
              sx={{ overflow: 'hidden' }}
              secondaryAction={
                <Stack
                  direction="column"
                  sx={{ height: '80px' }}
                  justifyContent="space-between"
                >
                  {cannotEdit(topic) ? (
                    <Tooltip
                      title="Archiving this topic will freeze it and 
                             move it to the historical views. 
                             Board members can also archive your older (7 days) posts ."
                    >
                      <IconButton
                        sx={{
                          visibility: canArchive(topic) ? 'visible' : 'hidden',
                        }}
                        edge="end"
                        aria-label="archive"
                        onClick={() => confirmArchive(i)}
                      >
                        <DoneAllIcon />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Tooltip
                      title="Editing this topic is only allowed very early, 
                                    before others have voted or commented on it."
                    >
                      <IconButton
                        sx={{
                          visibility:
                            member.id === topic.member_id
                              ? 'visible'
                              : 'hidden',
                        }}
                        edge="end"
                        aria-label="edit"
                        onClick={() => editTopic(i)}
                      >
                        <EditOutlinedIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title={expanded[i] ? 'Collapse' : 'Expand'}>
                    <IconButton
                      sx={{ visibility: needsExpand[i] ? 'visible' : 'hidden' }}
                      edge="end"
                      aria-label="expand"
                      onClick={() => toggleExpand(i)}
                    >
                      {expanded[i] ? (
                        <KeyboardArrowUpIcon size="small" />
                      ) : (
                        <KeyboardArrowDownIcon size="small" />
                      )}
                    </IconButton>
                  </Tooltip>
                </Stack>
              }
            >
              <Stack
                sx={{
                  width: '100%',
                  maxHeight: expanded[i] ? 'auto' : '110px',
                  minHeight: '80px',
                  overflowY: 'scroll',
                }}
                ref={(node) => {
                  if (!node) return;
                  needsExpand[i] = node.offsetHeight >= 110;
                  setNeedsExpand(needsExpand);
                }}
              >
                <Stack direction="row" alignItems="start">
                  <ListItemIcon sx={{ display: { xs: 'none', sm: 'block' } }}>
                    {topic.type === 'proposition' ? (
                      <BallotIcon fontSize="large" />
                    ) : (
                      <AnnouncementIcon fontSize="large" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    disableTypography
                    primary={
                      <Fragment>
                        {topic.subject}
                        <span
                          style={{
                            fontSize: '14px',
                            paddingLeft: '16px',
                          }}
                        >
                          (
                          <Tooltip title={topic.address}>
                            <span>{topic.name || 'Ex member'}</span>
                          </Tooltip>
                          &nbsp; - {longAgo(topic.creation_timestamp)})
                        </span>
                      </Fragment>
                    }
                    secondary={
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Box sx={{ fontSize: '14px', flexGrow: '1' }}>
                          {topic.description}
                          {topic.description && topic.tags.length ? <br /> : ''}
                          {topicTags(topic)}
                          {topic.type === 'announcement' ? (
                            <Fragment>
                              {topic.description ? '' : 'Comment: '}
                              <CommentsList
                                checkChange={checkChange}
                                setChanged={setTopicChanged}
                                setCommentCancel={setCommentCancel}
                                comments={topic.propositions[0].comments}
                                topicId={topic.id}
                                propositionId={topic.propositions[0].id}
                              />
                            </Fragment>
                          ) : (
                            ''
                          )}
                        </Box>
                        {topic.type === 'announcement' ? (
                          <Box sx={{ whiteSpace: 'nowrap' }}>
                            <Tooltip
                              title={
                                topic.propositions[0].vote
                                  ? 'Withdraw your feedback.'
                                  : 'Like this announcement. Your feedback is anonymous.'
                              }
                            >
                              <IconButton
                                size="small"
                                disabled={community.is_observer}
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
                            </Tooltip>
                            <span style={{ fontSize: '14px' }}>
                              ({topic.propositions[0].votes_up})
                            </span>
                          </Box>
                        ) : (
                          ''
                        )}
                      </Box>
                    }
                  />
                </Stack>
                <Box
                  sx={{
                    marginLeft: { xs: '0', sm: '54px' },
                  }}
                >
                  {topic.type === 'proposition'
                    ? topic.propositions.map((proposition, j) => (
                        <Box
                          key={proposition.id}
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                          }}
                        >
                          <Box sx={{ flexGrow: '1' }}>
                            <b>Proposition:</b> {proposition.description}
                            <CommentsList
                              checkChange={checkChange}
                              setChanged={setTopicChanged}
                              setCommentCancel={setCommentCancel}
                              comments={proposition.comments}
                              topicId={topic.id}
                              propositionId={proposition.id}
                            />
                          </Box>
                          <Box sx={{ whiteSpace: 'nowrap' }}>
                            <Tooltip
                              title={
                                proposition.vote === true
                                  ? 'Withdraw your vote.'
                                  : 'Vote to support this proposition. Your vote is anonymous.'
                              }
                            >
                              <IconButton
                                size="small"
                                disabled={community.is_observer}
                                onClick={() => {
                                  vote(topic, proposition, true);
                                }}
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
                            </Tooltip>
                            <span style={{ fontSize: '14px' }}>
                              ({proposition.votes_up})
                            </span>
                            <Tooltip
                              title={
                                proposition.vote === false
                                  ? 'Withdraw your vote.'
                                  : 'Vote against this proposition. Your vote is anonymous.'
                              }
                            >
                              <IconButton
                                size="small"
                                disabled={community.is_observer}
                                onClick={() => vote(topic, proposition, false)}
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
                            </Tooltip>
                            <span style={{ fontSize: '14px' }}>
                              ({proposition.votes_down})
                            </span>
                          </Box>
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
    const community = await getData(`/api/community/${communityId}`);
    const member = await getData(`/api/member/user/${communityId}`);
    const topics = await getData(`/api/topic/${communityId}`);
    return { community, member, topics };
  } catch ({ message: error }) {
    return { error };
  }
}

export default TopicsList;
