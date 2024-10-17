import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import InsertCommentOutlinedIcon from '@mui/icons-material/InsertCommentOutlined';
import ReplyRoundedIcon from '@mui/icons-material/ReplyRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
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
  setCommentCancel,
  setChanged,
  checkChange,
  comments,
  topicId,
  propositionId,
  commentId,
  noComment,
  member,
}) => {
  const [addComment, setAddComment] = useState(false);
  let [commentEdit, setCommentEdit] = useState(null);
  let [deleteIndex, setDeleteIndex] = useState(null);
  const deleteDialog = flagState(useState(false));

  const clearEdits = () => {
    setAddComment(false);
    setCommentEdit(false);
  };

  const addNewComment = () => {
    checkChange(() => {
      setCommentCancel({ callback: clearEdits });
      setAddComment(!addComment);
    });
  };

  const addDone = (comment) => {
    comments.push(comment);
  };

  const editDone = (comment) => {
    comments[comments.length - 1 - commentEdit] = comment;
  };

  const confirmDelete = (i) => {
    checkChange(() => {
      setChanged(true);
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
    setChanged(false);
  };

  const editComment = (i) => {
    checkChange(() => {
      setCommentCancel({ callback: clearEdits });
      setTimeout(() => setCommentEdit(i), 0);
    });
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

  return (
    <Fragment>
      <Tooltip title="Add your own comment. Your nickname and address will be visible with it.">
        <IconButton
          edge="end"
          aria-label="add comment"
          onClick={addNewComment}
          size="small"
          sx={{
            marginLeft: '8px',
            visibility: noComment?.() ? 'hidden' : 'visible',
          }}
        >
          {propositionId ? (
            <InsertCommentOutlinedIcon fontSize="xsmall" />
          ) : (
            <ReplyRoundedIcon fontSize="xsmall" />
          )}
        </IconButton>
      </Tooltip>
      <Stack sx={{ marginLeft: '8px' }}>
        {addComment ? (
          <AddComment
            setEditComment={setAddComment}
            setChanged={setChanged}
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
                          <IconButton
                            sx={{
                              marginLeft: '8px',
                            }}
                            edge="end"
                            aria-label="edit comment"
                            size="small"
                            onClick={() => editComment(i)}
                          >
                            <EditOutlinedIcon fontSize="xsmall" />
                          </IconButton>
                        )}
                        {comment.images.length ? (
                          <Attachements
                            prefix={`topic/${topicId}`}
                            images={comment.images}
                          />
                        ) : (
                          ''
                        )}
                      </Fragment>
                    ) : (
                      <AddComment
                        setEditComment={() => setCommentEdit(null)}
                        setChanged={setChanged}
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
                      checkChange={checkChange}
                      setChanged={setChanged}
                      setCommentCancel={setCommentCancel}
                      comments={comment.comments}
                      topicId={topicId}
                      commentId={comment.id}
                      noComment={() => cannotReply(comment)}
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
