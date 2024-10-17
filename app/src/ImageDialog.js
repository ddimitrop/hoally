import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import ClearIcon from '@mui/icons-material/Clear';
import IconButton from '@mui/material/IconButton';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import pdf from './pdf.png';

const ImageDialog = ({ prefix, control, images, setCurrent, current }) => {
  function close() {
    control.close();
  }

  const hasNext = () => current() < images.length - 1;

  const next = () => {
    setCurrent(current() + 1);
  };

  const hasPrev = () => current() > 0;

  const prev = () => {
    setCurrent(current() - 1);
  };

  return (
    <Dialog
      open={control.isOpen()}
      onClose={close}
      fullWidth={true}
      maxWidth={false}
    >
      <DialogContent style={{ position: 'relative' }}>
        <IconButton
          sx={[
            {
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              position: 'absolute',
              right: '36px',
              top: '36px',
            },
            {
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
              },
            },
          ]}
          aria-label="close"
          onClick={close}
          color="primary"
        >
          <ClearIcon />
        </IconButton>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '0',
            width: '100%',
            marginTop: '-12px',
          }}
        >
          <IconButton
            sx={[
              {
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                position: 'absolute',
                left: '36px',
                top: '0',
              },
              {
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                },
              },
            ]}
            aria-label="close"
            onClick={prev}
            color="primary"
            disabled={!hasPrev()}
          >
            <ArrowBackIosNewIcon />
          </IconButton>
          <IconButton
            sx={[
              {
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                position: 'absolute',
                right: '36px',
                top: '0',
              },
              {
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                },
              },
            ]}
            aria-label="close"
            onClick={next}
            color="primary"
            disabled={!hasNext()}
          >
            <ArrowForwardIosIcon />
          </IconButton>
        </div>
        {isPdf(images[current()]) ? (
          <iframe
            style={{ width: '100%', height: '860px' }}
            src={imagePath(prefix, images[current()])}
          ></iframe>
        ) : (
          <img
            style={{ width: '100%' }}
            src={imagePath(prefix, images[current()])}
          ></img>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ImageDialog;

export function imagePath(prefix, image, thumbnail = false) {
  if (thumbnail && isPdf(image)) return pdf;
  const folder = image.startsWith('t_') ? 'tmp' : prefix;
  return `/images/${folder}/${thumbnail ? 's_' : ''}${image}`;
}

export function isPdf(fileName) {
  return fileName.endsWith('.pdf');
}
