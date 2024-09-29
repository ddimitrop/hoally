import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import Fade from '@mui/material/Fade';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Button from '@mui/material/Button';
import { Global } from './Global.js';
import { useRef, useEffect, useContext, useState, Fragment } from 'react';
import ConfirmDialog from './ConfirmDialog.js';
import { hasModifications, flagState } from './state-utils';
import { useParams } from 'react-router-dom';
import { postData } from './json-utils.js';

const AddMember = ({ member, done, setChanged, addresses }) => {
  const global = useContext(Global);
  const addMemberForm = useRef(null);
  const address = useRef(null);
  const invitationFullName = useRef(null);
  const invitationEmail = useRef(null);
  const isAdmin = useRef(null);
  const isBoardMember = useRef(null);
  const isModerator = useRef(null);
  const isObserver = useRef(null);
  const [selectNumber, setSelectNumber] = useState(true);
  const [addressInValid, setAddressInValid] = useState(false);
  const unassignDialog = flagState(useState(false));
  const { communityId } = useParams();

  const isNewMember = () => !member.id;

  const isExistingAddress = () => {
    if (!address.current) return false;
    if (address.current.value === member.address && !isNewMember())
      return false;
    return addresses.indexOf(address.current.value) !== -1;
  };

  const getFormData = () => {
    return {
      address: address.current.value,
      invitation_full_name: invitationFullName.current.value,
      invitation_email: invitationEmail.current.value,
      is_admin: isAdmin.current.checked,
      is_board_member: isBoardMember.current.checked,
      is_moderator: isModerator.current.checked,
      is_observer: isObserver.current.checked,
    };
  };

  const checkWasChanged = () => {
    setAddressInValid(isExistingAddress());
    setChanged(hasModifications(member, getFormData()));
  };

  useEffect(() => {
    const addressEl = address.current;
    if (!addressEl) return;
    if (!selectNumber) return;
    setSelectNumber(false);
    const numberPart = addressEl.value.split(' ')[0];
    if (numberPart) {
      addressEl.setSelectionRange(0, numberPart.length);
      addressEl.focus();
    }
  }, [selectNumber]);

  const saveMember = () => {
    const invalid = isExistingAddress();
    setAddressInValid(invalid);
    if (invalid) return;
    const isNew = isNewMember();
    const data = getFormData();
    data.id = member.id;
    data.community_id = communityId;
    return postData('/api/member', data, isNew ? 'POST' : 'PUT')
      .then(({ appError, member: savedMember }) => {
        if (appError) {
          global.setAppError(appError);
        } else {
          Object.assign(member, savedMember);
          done(member, isNew);
        }
      })
      .catch((e) => {
        global.setAppError(e.message);
      });
  };

  const confirmUnassign = () => {
    unassignDialog.open();
  };

  const unassign = () => {
    const data = { id: member.id, communityId };
    return postData('/api/member/unassign', data)
      .then(({ appError, member: savedMember }) => {
        if (appError) {
          global.setAppError(appError);
        } else {
          unassignDialog.close();
          Object.assign(member, savedMember);
          delete member.name;
          done(member, false);
        }
      })
      .catch((e) => {
        global.setAppError(e.message);
      });
  };

  return (
    <Fragment>
      <Grid
        ref={addMemberForm}
        component="form"
        container
        spacing={1}
        sx={{ flexGrow: '1', maxWidth: 'sm' }}
        onSubmit={(event) => {
          event.preventDefault();
          saveMember();
        }}
      >
        <Grid item xs={12}>
          <TextField
            required
            margin="dense"
            id="address"
            name="address"
            label="Member address"
            error={addressInValid}
            helperText={addressInValid ? 'Duplicate address' : ''}
            defaultValue={member.address}
            fullWidth
            autoComplete="no-auto-complete"
            variant="standard"
            autoFocus
            inputRef={address}
            onChange={checkWasChanged}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            margin="dense"
            id="invitation_full_name"
            name="invitation_full_name"
            label="Invitation name"
            defaultValue={member.invitation_full_name}
            fullWidth
            autoComplete="no-auto-complete"
            variant="standard"
            inputRef={invitationFullName}
            onChange={checkWasChanged}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            margin="dense"
            id="invitation_email"
            name="invitation_email"
            label="Invitation email"
            type="email"
            defaultValue={member.invitation_email}
            fullWidth
            autoComplete="no-auto-complete"
            variant="standard"
            inputRef={invitationEmail}
            onChange={checkWasChanged}
          />
        </Grid>
        {member.name ? (
          <Grid item xs={12}>
            Assigned to user:
            <Chip sx={{ marginLeft: '8px' }} label={member.name} />
          </Grid>
        ) : (
          ''
        )}
        <Grid item xs={12}>
          <Tooltip
            TransitionComponent={Fade}
            TransitionProps={{ timeout: 600 }}
            title="A board member can archive topics and has no limits on posts."
          >
            <FormControlLabel
              control={
                <Checkbox
                  inputRef={isBoardMember}
                  defaultChecked={member.is_board_member}
                  onChange={checkWasChanged}
                />
              }
              label="Board member"
            />
          </Tooltip>
          <Tooltip
            TransitionComponent={Fade}
            TransitionProps={{ timeout: 600 }}
            title="A moderator can temporarily hide topics and comments that are not respectful and do not follow the Hoally guidelines."
          >
            <FormControlLabel
              control={
                <Checkbox
                  inputRef={isModerator}
                  defaultChecked={member.is_moderator}
                  onChange={checkWasChanged}
                />
              }
              label="Moderator"
            />
          </Tooltip>
          <Tooltip
            TransitionComponent={Fade}
            TransitionProps={{ timeout: 600 }}
            title="An observer can post topics and reply to comments but can not vote."
          >
            <FormControlLabel
              control={
                <Checkbox
                  inputRef={isObserver}
                  defaultChecked={member.is_observer}
                  onChange={checkWasChanged}
                />
              }
              label="Observer"
            />
          </Tooltip>
          <Tooltip
            TransitionComponent={Fade}
            TransitionProps={{ timeout: 600 }}
            title="An admin can edit community and member properties and assign member roles."
          >
            <FormControlLabel
              control={
                <Checkbox
                  inputRef={isAdmin}
                  defaultChecked={member.is_admin}
                  onChange={checkWasChanged}
                />
              }
              label="Admin"
            />
          </Tooltip>
        </Grid>
        <Grid
          item
          xs={6}
          sx={{
            display: 'flex',
            justifyContent: 'start',
            alignItems: 'end',
            gap: '12px',
          }}
        >
          {member.name ? (
            <Button
              color="error"
              onClick={() => {
                confirmUnassign();
              }}
            >
              Unassign
            </Button>
          ) : (
            ''
          )}
        </Grid>
        <Grid
          item
          xs={6}
          sx={{
            display: 'flex',
            justifyContent: 'end',
            alignItems: 'end',
            gap: '12px',
          }}
        >
          <Button
            onClick={() => {
              done();
            }}
          >
            Cancel
          </Button>
          <Button variant="contained" type="submit">
            Save
          </Button>
        </Grid>
      </Grid>
      <ConfirmDialog
        control={unassignDialog}
        onConfirm={unassign}
        title="Unassign member ?"
        text={`Uassigning ${member.name} from community member would make their posts and comments anonymous.`}
        action="Yes"
      />
    </Fragment>
  );
};

export default AddMember;
