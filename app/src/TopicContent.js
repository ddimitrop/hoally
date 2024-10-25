import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import CampaignIcon from '@mui/icons-material/Campaign';
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt';
import ThumbDownOffAltIcon from '@mui/icons-material/ThumbDownOffAlt';
import FavoriteIcon from '@mui/icons-material/Favorite';
import BallotIcon from '@mui/icons-material/Ballot';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { Global } from './Global.js';
import { useNavigate } from 'react-router-dom';
import { useState, useContext, Fragment } from 'react';
import { postData, longAgo } from './json-utils.js';
import { red } from '@mui/material/colors';
import { green } from '@mui/material/colors';
import { useTheme } from '@mui/material/styles';
import CommentsList from './CommentsList';
import Attachements from './Attachments.js';
import './Markdown.css';

const TopicContent = ({ topic, member, community, summary, protect }) => {
  const global = useContext(Global);
  const navigate = useNavigate();
  const theme = useTheme();
  let [voteCount, setVoteCount] = useState(0);
  if (!protect) protect = { checkChange: (callback) => callback() };

  const voteUpColor = green[800];
  const voteDownColor = red[800];
  const likeColor = red[700];
  const noVoteColor = theme.palette.grey[600];

  const topicTags = (topic) =>
    topic.tags?.length ? topic.tags.map((tag) => `#${tag}`).join(', ') : '';

  const loveTopic = (topic) => {
    vote(topic, topic.propositions[0], true);
  };

  const vote = (topic, proposition, vote) => {
    protect.checkChange(() => {
      if (proposition.vote === vote) {
        vote = null;
      }
      postData(`/api/topic/${topic.id}/vote/${proposition.id}`, {
        vote,
      })
        .then(({ appError, votes }) => {
          if (appError) {
            global.setAppError(appError);
          } else {
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
          }
        })
        .catch(({ message }) => {
          global.setAppError(message);
        });
    });
  };

  const cannotComment = (topic) => topic.member_id === member.id;

  const topicUrl = () => `/topic/${community.id}/view/${topic.id}/`;

  const viewTopic = () => {
    if (summary) {
      navigate(topicUrl());
    }
  };

  return topic.id ? (
    <Stack
      sx={{
        width: '100%',
      }}
    >
      <Stack direction="row" alignItems="start">
        <ListItemIcon sx={{ display: { xs: 'none', sm: 'block' } }}>
          {topic.type === 'proposition' ? (
            <BallotIcon fontSize="large" />
          ) : (
            <CampaignIcon fontSize="large" />
          )}
        </ListItemIcon>
        <ListItemText
          sx={{ margin: 0 }}
          disableTypography
          primary={
            <Fragment>
              {!summary ? (
                topic.subject
              ) : (
                <a
                  href={topicUrl()}
                  style={{ color: 'inherit' }}
                  onClick={(event) => {
                    viewTopic();
                    event.preventDefault();
                  }}
                >
                  {topic.subject}
                </a>
              )}
              <span
                style={{
                  fontSize: '14px',
                  paddingLeft: '16px',
                  cursor: summary ? 'pointer' : 'inherit',
                }}
                role="button"
                onClick={viewTopic}
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
                <span
                  style={{
                    cursor: summary ? 'pointer' : 'inherit',
                  }}
                  role="button"
                  onClick={viewTopic}
                >
                  {topic.description}
                  {topic.description && topic.tags.length ? <br /> : ''}
                  {topicTags(topic)}
                </span>
                {topic.type === 'announcement' ? (
                  <Fragment>
                    {topic.description
                      ? ''
                      : cannotComment(topic)
                        ? ''
                        : 'Comment: '}
                    <CommentsList
                      summary={summary ? viewTopic : undefined}
                      protect={protect}
                      comments={topic.propositions[0].comments}
                      topicId={topic.id}
                      propositionId={topic.propositions[0].id}
                      noComment={cannotComment(topic)}
                      member={member}
                    />
                  </Fragment>
                ) : (
                  ''
                )}
                {topic.images.length ? (
                  <Attachements
                    prefix={`topic/${topic.id}`}
                    images={topic.images}
                    small={!!summary}
                  />
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
                    summary={summary ? viewTopic : undefined}
                    protect={protect}
                    comments={proposition.comments}
                    topicId={topic.id}
                    propositionId={proposition.id}
                    noComment={cannotComment(topic)}
                    member={member}
                  />
                  {proposition.images.length ? (
                    <Attachements
                      prefix={`topic/${topic.id}`}
                      images={proposition.images}
                      small={!!summary}
                    />
                  ) : (
                    ''
                  )}
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
  ) : (
    ''
  );
};

export default TopicContent;
