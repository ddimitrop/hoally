import { useRef, useContext, Fragment } from 'react';
import { uploadData, postData } from './json-utils.js';
import { Global } from './Global.js';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import IconButton from '@mui/material/IconButton';

const UploadButton = ({ done }) => {
  const global = useContext(Global);
  const fileInput = useRef(null);
  const openUpload = () => {
    fileInput.current.click();
  };

  const upload = () => {
    const file = fileInput.current.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    uploadData('/api/upload/topic', formData)
      .then(({ filename }) => {
        if (filename) {
          done(filename);
        }
      })
      .catch((e) => {
        global.setAppError(e.message);
      });
  };

  return (
    <Fragment>
      <input
        type="file"
        name="file"
        ref={fileInput}
        style={{ display: 'none' }}
        accept="image/png,image/jpg,.pdf"
        onChange={upload}
      />
      <IconButton
        size="small"
        aria-label="upload attachement"
        onClick={openUpload}
      >
        <AttachFileIcon fontSize="small" />
      </IconButton>
    </Fragment>
  );
};

export async function clearImage(filename) {
  if (!filename.startsWith('t_')) return;
  return postData('/api/upload/clear', { filename });
}

export default UploadButton;
