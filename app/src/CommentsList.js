import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import InsertCommentOutlinedIcon from '@mui/icons-material/InsertCommentOutlined';
import ReplyRoundedIcon from '@mui/icons-material/ReplyRounded';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import { useState, Fragment } from 'react';
import { flagState } from './state-utils.js';
import AddComment from './AddComment.js';
import DeleteConfirmDialog from './DeleteConfirmDialog';

const CommentsList = ({
  setCommentCancel,
  setChanged,
  checkChange,
  comments,
  topicId,
  propositionId,
  commentId,
  noReply,
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
      // We show the list in reverse.
      setDeleteIndex(comments.length - 1 - i);
      deleteDialog.open();
    });
  };

  const deleteComment = () => {
    comments.splice(deleteIndex, 1);
    setDeleteIndex(null);
  };

  const editComment = (i) => {
    checkChange(() => {
      setCommentCancel({ callback: clearEdits });
      setTimeout(() => setCommentEdit(i), 0);
    });
  };

  const noReplyOnEdit = () => commentEdit != null;

  return (
    <Fragment>
      {noReply?.() ? (
        ''
      ) : (
        <IconButton
          edge="end"
          aria-label="add comment"
          onClick={addNewComment}
          size="small"
          sx={{ marginLeft: '16px' }}
        >
          {propositionId ? (
            <InsertCommentOutlinedIcon fontSize="xsmall" />
          ) : (
            <ReplyRoundedIcon fontSize="xsmall" />
          )}
        </IconButton>
      )}
      <Stack sx={{ marginLeft: '32px' }}>
        {addComment ? (
          <AddComment
            setEditComment={setAddComment}
            setChanged={setChanged}
            comment={{}}
            done={addDone}
            topicId={topicId}
            propositionId={propositionId}
            commentId={commentId}
          />
        ) : (
          ''
        )}
        <List dense={true} disablePadding={true}>
          {[...comments].reverse().map((comment, i) => (
            <ListItem disablePadding={true} key={comment.id}>
              <ListItemText
                primary={
                  <Fragment>
                    {commentEdit !== i ? (
                      <Fragment>
                        {comment.discussion}
                        <IconButton
                          sx={{ marginLeft: '32px' }}
                          edge="end"
                          aria-label="edit comment"
                          size="small"
                          onClick={() => editComment(i)}
                        >
                          <EditOutlinedIcon fontSize="xsmall" />
                        </IconButton>
                        <IconButton
                          edge="end"
                          aria-label="delete comment"
                          size="small"
                          onClick={() => confirmDelete(i)}
                        >
                          <DeleteOutlineIcon fontSize="xsmall" />
                        </IconButton>{' '}
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
                      />
                    )}
                    <CommentsList
                      checkChange={checkChange}
                      setChanged={setChanged}
                      setCommentCancel={setCommentCancel}
                      comments={comment.comments}
                      topicId={topicId}
                      commentId={comment.id}
                      noReply={noReplyOnEdit}
                    />
                  </Fragment>
                }
              ></ListItemText>
            </ListItem>
          ))}
        </List>
        <DeleteConfirmDialog
          control={deleteDialog}
          onDelete={() => {
            deleteComment();
          }}
          deleteApiPath={`/api/comment/${topicId}/${comments[deleteIndex]?.id}`}
          deleteTitle="Delete comment ?"
          deleteText="Deleting the comment can't be undone."
        />
      </Stack>
    </Fragment>
  );
};

export default CommentsList;
