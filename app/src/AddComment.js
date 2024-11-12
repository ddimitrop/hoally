import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { Global } from './Global.js';
import { hasModifications } from './state-utils';
import { useRef, useContext, useState, Fragment } from 'react';
import { postData } from './json-utils.js';
import UploadButton, { clearImage } from './UploadButton.js';
import Attachements from './Attachments.js';

const AddComment = ({
  protect,
  setEditComment,
  comment,
  done,
  topicId,
  propositionId,
  commentId,
  confirmDelete,
  member,
}) => {
  const global = useContext(Global);
  const discussion = useRef(null);
  let [images, setImages] = useState(comment.images || []);

  const clearEdits = () => {
    setEditComment(false);
    protect.setChanged(false);
  };

  const checkWasChanged = () => {
    const wasChanged = hasModifications(comment, getFormData());
    protect.setChanged(wasChanged);
  };

  const getFormData = () => {
    return { discussion: discussion.current.value, images };
  };

  const imageUpload = (fileName) => {
    setImages([...images, fileName]);
  };

  const removeImage = (i) => {
    const filename = images[i];
    clearImage(filename);
    images.splice(i, 1);
    setImages([...images]);
  };

  const isNewComment = () => !comment.id;

  const postComment = () => {
    const subComments = comment?.comments || [];
    comment = { ...comment, ...getFormData() };
    comment.vote_item_id = propositionId;
    comment.comment_id = commentId;
    const isNew = comment.id == null;
    return postData(`/api/comment/${topicId}`, comment, isNew ? 'POST' : 'PUT')
      .then(({ appError, comment }) => {
        if (appError) {
          global.setAppError(appError);
        } else {
          comment.comments = subComments;
          comment.address = member.address;
          comment.name = global.getCurrentUser().name;
          done(comment);
          clearEdits();
        }
      })
      .catch((e) => {
        global.setAppError(e.message);
      });
  };

  const cancel = () => {
    clearEdits();
  };

  return (
    <Fragment>
      <Stack
        sx={{ marginTop: '12px' }}
        spacing={1}
        component="form"
        onSubmit={(event) => {
          event.preventDefault();
          postComment();
        }}
      >
        <Stack direction="row" spacing={2} alignItems="start">
          <TextField
            id="outlined-basic"
            label="Comment"
            variant="outlined"
            size="small"
            fullWidth
            multiline
            maxRows={4}
            defaultValue={comment.discussion}
            inputRef={discussion}
            onChange={checkWasChanged}
            autoFocus
          />
          {images.length < 8 ? (
            <UploadButton done={imageUpload}></UploadButton>
          ) : (
            ''
          )}
        </Stack>
        <Stack direction="row" spacing={2} justifyContent="end">
          {!isNewComment() ? (
            <Button
              size="small"
              color="error"
              onClick={() => {
                confirmDelete();
              }}
            >
              Delete
            </Button>
          ) : (
            ''
          )}
          <Button size="small" variant="outlined" onClick={cancel}>
            Cancel
          </Button>
          <Button size="small" variant="contained" type="submit">
            {isNewComment() ? 'Post' : 'Change'}
          </Button>
        </Stack>
      </Stack>
      <Attachements
        prefix={`topic/${topicId}`}
        images={images}
        removeImage={removeImage}
        small={true}
      />
    </Fragment>
  );
};

export default AddComment;
