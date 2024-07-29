import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { useRef, useEffect } from 'react';

const AddMember = ({ member, done }) => {
  const addMemberForm = useRef(null);
  const address = useRef(null);

  useEffect(() => {
    const addressEl = address.current;
    const numberPart = addressEl?.value?.split(' ')?.[0];
    if (numberPart) {
      addressEl.setSelectionRange(0, numberPart.length);
      addressEl.focus();
    }
  });

  return (
    <Grid
      component="form"
      ref={addMemberForm}
      container
      spacing={1}
      sx={{ flexGrow: '1', maxWidth: 'sm' }}
    >
      <Grid item xs={12}>
        <TextField
          required
          margin="dense"
          id="member_address"
          name="address"
          label="Member address"
          defaultValue={member.address}
          fullWidth
          autoComplete="no-auto-complete"
          variant="standard"
          autoFocus
          inputRef={address}
        />
      </Grid>
      <Grid item xs={6}>
        <TextField
          margin="dense"
          id="invitation_name"
          name="invitation_name"
          label="Invitation name"
          defaultValue={member.invitation_name}
          fullWidth
          autoComplete="no-auto-complete"
          variant="standard"
        />
      </Grid>
      <Grid item xs={6}>
        <TextField
          margin="dense"
          id="invitation_email"
          name="invitation_email"
          label="Invitation email"
          defaultValue={member.invitation_email}
          fullWidth
          autoComplete="no-auto-complete"
          variant="standard"
        />
      </Grid>
      <Grid item xs={9}>
        <FormControlLabel
          control={<Checkbox defaultChecked={member.is_board_member} />}
          label="Board member"
        />
        <FormControlLabel
          control={<Checkbox defaultChecked={member.is_moderator} />}
          label="Moderator"
        />
        <FormControlLabel
          control={<Checkbox defaultChecked={member.is_admin} />}
          label="Admin"
        />
      </Grid>
      <Grid
        item
        xs={3}
        sx={{
          display: 'flex',
          justifyContent: 'end',
          alignItems: 'end',
          gap: '12px',
        }}
      >
        <Button
          variant="outlined"
          onClick={() => {
            done();
          }}
        >
          Cancel
        </Button>
        <Button
          variant="outlined"
          onClick={() => {
            done();
          }}
        >
          Save
        </Button>
      </Grid>
    </Grid>
  );
};

export default AddMember;
