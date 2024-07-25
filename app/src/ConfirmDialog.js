import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';

const ConfirmDialog = ({
  control,
  onConfirm,
  title,
  text,
  action,
  onClose = () => {},
  errorMessage = null,
  severity = 'warning',
  actionColor = 'error',
}) => {
  const close = () => {
    control.close();
    onClose();
  };
  return (
    <Dialog
      open={control.isOpen()}
      onClose={close}
      PaperProps={{
        component: 'form',
        onSubmit: (event) => {
          event.preventDefault();
          onConfirm();
        },
      }}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Alert severity={severity}>{text}</Alert>
        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : ''}
      </DialogContent>
      <DialogActions>
        <Button onClick={close}>Cancel</Button>
        <Button variant="contained" color={actionColor} type="submit">
          {action}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
