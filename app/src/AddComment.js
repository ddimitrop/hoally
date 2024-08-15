import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { Global } from './Global.js';
import { hasModifications } from './state-utils';
import { useRef, useContext } from 'react';
import { postData } from './json-utils.js';

const AddComment = ({
  setEditComment,
  setChanged,
  comment,
  done,
  topicId,
  propositionId,
  commentId,
}) => {
  const global = useContext(Global);
  const discussion = useRef(null);

  const clearEdits = () => {
    setEditComment(false);
    setChanged(false);
  };

  const checkWasChanged = () => {
    const wasChanged = hasModifications(comment, getFormData());
    setChanged(wasChanged);
  };

  const getFormData = () => {
    return { discussion: discussion.current.value };
  };

  const postComment = () => {
    const subComments = comment?.comments || [];
    comment = { ...comment, ...getFormData() };
    comment.vote_item_id = propositionId;
    comment.comment_id = commentId;
    const isNew = comment.id == null;
    return postData(`/api/comment/${topicId}`, comment, isNew ? 'POST' : 'PUT')
      .then(({ ok }) => {
        if (ok) {
          comment.comments = subComments;
          done(comment);
        }
        clearEdits();
      })
      .catch((e) => {
        global.setAppError(e.message);
      });
  };

  const cancel = () => {
    clearEdits();
  };

  return (
    <Stack
      direction="row"
      spacing={2}
      alignItems="center"
      component="form"
      onSubmit={(event) => {
        event.preventDefault();
        postComment();
      }}
    >
      <TextField
        id="outlined-basic"
        label="Comment"
        variant="outlined"
        size="small"
        fullWidth
        defaultValue={comment.discussion}
        inputRef={discussion}
        onChange={checkWasChanged}
        autoFocus
      />
      <Button variant="outlined" onClick={cancel}>
        Cancel
      </Button>
      <Button variant="contained" type="submit">
        Post
      </Button>
    </Stack>
  );
};

export default AddComment;
