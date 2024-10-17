import { useState, Fragment } from 'react';
import IconButton from '@mui/material/IconButton';
import ClearIcon from '@mui/icons-material/Clear';
import { flagState } from './state-utils.js';
import ImageDialog, { imagePath } from './ImageDialog.js';

const Attachements = ({ prefix, images, removeImage }) => {
  const size = '64px';
  const gap = '8px';
  const dialog = flagState(useState(false));
  const [currentImage, setCurrentImage] = useState(0);

  const dialogImage = (i) => {
    setCurrentImage(i);
    dialog.open();
  };

  return (
    <Fragment>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: gap,
        }}
      >
        {images.map((image, i) => (
          <div
            key={image}
            role="button"
            style={{
              marginTop: '12px',
              backgroundImage: `url("${imagePath(prefix, image, true)}")`,
              backgroundPosition: 'center',
              backgroundSize: 'cover',
              backgroundRepeat: 'no-repeat',
              height: size,
              width: size,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'end',
              padding: '2px',
              cursor: 'pointer',
              borderRadius: '8px',
            }}
            onClick={() => dialogImage(i)}
          >
            {removeImage ? (
              <IconButton
                sx={[
                  { backgroundColor: 'rgba(255, 255, 255, 0.4)' },
                  {
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    },
                  },
                ]}
                aria-label="delete"
                color="error"
                onClick={() => removeImage(i)}
                size="small"
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            ) : (
              ''
            )}
          </div>
        ))}
      </div>
      {images.length ? (
        <ImageDialog
          prefix={prefix}
          control={dialog}
          images={images}
          setCurrent={setCurrentImage}
          current={() => currentImage}
        />
      ) : (
        ''
      )}
    </Fragment>
  );
};

export default Attachements;
