import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import AddCommentTwoToneIcon from '@mui/icons-material/AddCommentTwoTone';
import ReplyRoundedIcon from '@mui/icons-material/ReplyRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ForumRoundedIcon from '@mui/icons-material/ForumRounded';
import Tooltip from '@mui/material/Tooltip';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import { useState, Fragment } from 'react';
import { flagState } from './state-utils.js';
import { longAgo } from './json-utils.js';
import AddComment from './AddComment.js';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import Attachements from './Attachments.js';

const CommentsList = ({
  summary,
  protect,
  comments,
  topicId,
  propositionId,
  commentId,
  noComment,
  readonly,
  member,
}) => {
  const [addComment, setAddComment] = useState(false);
  let [commentEdit, setCommentEdit] = useState(null);
  let [deleteIndex, setDeleteIndex] = useState(null);
  const deleteDialog = flagState(useState(false));

  const addNewComment = () => {
    protect.checkChange(
      () => {
        setAddComment(true);
      },
      () => {
        setAddComment(false);
      },
    );
  };

  const addDone = (comment) => {
    comments.push(comment);
  };

  const editDone = (comment) => {
    comments[comments.length - 1 - commentEdit] = comment;
  };

  const confirmDelete = (i) => {
    protect.checkChange(() => {
      // We show the list in reverse.
      setDeleteIndex(comments.length - 1 - i);
      deleteDialog.open();
    });
  };

  const deleteComment = () => {
    comments.splice(deleteIndex, 1);
    cancelDelete();
  };

  const cancelDelete = () => {
    setDeleteIndex(null);
  };

  const editComment = (i) => {
    protect.checkChange(
      () => {
        setTimeout(() => setCommentEdit(i), 0);
      },
      () => setCommentEdit(null),
    );
  };

  const cannotReply = (comment) => {
    if (comment.member_id === member.id) return true;
    return commentEdit != null;
  };

  const cannotEdit = (comment) => {
    if (comment.member_id !== member.id) return true;
    if (
      Date.now() - new Date(comment.creation_timestamp) >
      // Edit is not allowed after 1 day.
      1000 * 60 * 60 * 24 * 1
    ) {
      return true;
    }
    return comment.comments.length !== 0;
  };

  const numComments = () => {
    const countComments = (comments) => {
      let result = comments.length;
      for (const comment of comments) {
        result += countComments(comment.comments);
      }
      return result;
    };
    const total = countComments(comments);
    if (total === 0) return undefined;
    if (total === 1) return '1 comment';
    return `${total} comments`;
  };

  return summary ? (
    numComments() ? (
      <Chip
        size="small"
        sx={{ marginLeft: '8px' }}
        icon={<ForumRoundedIcon />}
        clickable={true}
        onClick={summary}
        label={numComments()}
      />
    ) : (
      ''
    )
  ) : (
    <Fragment>
      {noComment || readonly ? (
        ''
      ) : (
        <Tooltip title="Add your own comment. Your nickname and address will be visible with it.">
          <Chip
            size="small"
            sx={{ marginLeft: '8px' }}
            icon={
              propositionId ? <AddCommentTwoToneIcon /> : <ReplyRoundedIcon />
            }
            clickable={true}
            onClick={addNewComment}
            label={propositionId ? 'Post comment' : 'Reply'}
          />
        </Tooltip>
      )}
      <Stack sx={{ marginLeft: '16px' }}>
        {addComment ? (
          <AddComment
            setEditComment={setAddComment}
            protect={protect}
            comment={{}}
            done={addDone}
            topicId={topicId}
            propositionId={propositionId}
            commentId={commentId}
            member={member}
          />
        ) : (
          ''
        )}
        <List dense={true} disablePadding={true}>
          {[...comments].reverse().map((comment, i) => (
            <ListItem disablePadding={true} key={comment.id}>
              <ListItemText
                sx={{ margin: '0' }}
                primary={
                  <Fragment>
                    {commentEdit !== i ? (
                      <Fragment>
                        {comment.discussion}
                        <span
                          style={{
                            paddingLeft: '16px',
                          }}
                        >
                          (
                          <Tooltip title={comment.address}>
                            <span>{comment.name || 'Ex member'}</span>
                          </Tooltip>
                          &nbsp; - {longAgo(comment.creation_timestamp)})
                        </span>
                        {cannotEdit(comment) ? (
                          ''
                        ) : (
                          <Chip
                            size="small"
                            sx={{ marginLeft: '8px' }}
                            icon={<EditOutlinedIcon />}
                            clickable={true}
                            onClick={() => editComment(i)}
                            label="Change comment"
                          />
                        )}
                        {comment.images.length ? (
                          <Fragment>
                            <Attachements
                              prefix={`topic/${topicId}`}
                              images={comment.images}
                              small={true}
                            />
                            {!cannotReply(comment) ? 'Reply:' : ''}
                          </Fragment>
                        ) : (
                          ''
                        )}
                      </Fragment>
                    ) : (
                      <AddComment
                        setEditComment={() => setCommentEdit(null)}
                        protect={protect}
                        comment={comment}
                        done={editDone}
                        topicId={topicId}
                        propositionId={propositionId}
                        commentId={commentId}
                        confirmDelete={() => confirmDelete(i)}
                        member={member}
                      />
                    )}
                    <CommentsList
                      protect={protect}
                      comments={comment.comments}
                      topicId={topicId}
                      commentId={comment.id}
                      noComment={cannotReply(comment)}
                      readonly={readonly}
                      member={member}
                    />
                  </Fragment>
                }
              ></ListItemText>
            </ListItem>
          ))}
        </List>
        <DeleteConfirmDialog
          control={deleteDialog}
          onDelete={deleteComment}
          onClose={cancelDelete}
          deleteApiPath={`/api/comment/${topicId}/${comments[deleteIndex]?.id}`}
          deleteTitle="Delete comment ?"
          deleteText="Deleting the comment can't be undone."
        />
      </Stack>
    </Fragment>
  );
};

export default CommentsList;
