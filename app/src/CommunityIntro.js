import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { Global } from './Global.js';
import { useRef, useContext, useState, Fragment } from 'react';
import { hasModifications } from './state-utils';
import ConfirmDialog from './ConfirmDialog.js';
import { postData } from './json-utils.js';
import { flagState } from './state-utils.js';
import { useNavigate } from 'react-router-dom';
import InvitationsDialog from './InvitationsDialog.js';

const CommunityIntro = ({ stepper, community, members }) => {
  const global = useContext(Global);
  const navigate = useNavigate();
  const cancelDialog = flagState(useState(false));
  const invitationsDialog = flagState(useState(false));
  const intro = useRef(null);
  let [introChanged, setIntroChanged] = useState(false);
  let [onCancel, setOnCancel] = useState({ callback: () => {} });
  const invitationText = useRef(null);
  const origCommunity = { ...community };

  const inviteMembers = members.filter((member) => member.hoauser_id == null);
  const needToInvite = inviteMembers.length > 0;

  const getFormData = () => {
    return {
      intro: intro.current.value,
      invitation_text: invitationText.current.value,
    };
  };

  const checkChange = (callback) => {
    if (introChanged) {
      setOnCancel({ callback });
      cancelDialog.open();
    } else {
      callback();
    }
  };

  const revertChanges = () => {
    intro.current.value = community.intro = origCommunity.intro;
    invitationText.current.value = community.invitation_text =
      origCommunity.invitation_text;
  };

  const prevStep = () => {
    checkChange(() => {
      cancelDialog.close();
      revertChanges();
      setIntroChanged(false);
      stepper.prev();
    });
  };

  const gotoCommunity = () => {
    checkChange(() => {
      cancelDialog.close();
      revertChanges();
      setIntroChanged(false);
      navigate(`/topic/${community.id}`);
    });
  };

  const cancelIntro = () => {
    onCancel.callback();
    setOnCancel(() => {});
  };

  const checkIntroChanged = () => {
    const introChanged = hasModifications(community, getFormData());
    setIntroChanged(introChanged);
  };

  const updateIntro = () => {
    const data = getFormData();
    postData('/api/community/intro', {
      id: community.id,
      intro: data.intro,
      invitation_text: data.invitation_text,
    })
      .then(({ ok }) => {
        if (ok) {
          Object.assign(community, data);
          setIntroChanged(false);
        }
      })
      .catch((e) => {
        global.setAppError(e.message);
      });
  };

  const showInvitations = () => {
    invitationsDialog.open();
  };

  return (
    <Stack spacing={1} sx={{ flexGrow: '1' }}>
      <Stack
        sx={{ flexGrow: '1' }}
        component="form"
        onSubmit={(event) => {
          event.preventDefault();
          updateIntro();
        }}
      >
        <TextField
          required
          margin="dense"
          multiline
          rows={4}
          id="intro"
          name="intro"
          label={'Intro'}
          type="text"
          inputRef={intro}
          defaultValue={community.intro}
          onChange={checkIntroChanged}
          fullWidth
          variant="outlined"
        />
        <TextField
          required
          margin="dense"
          multiline
          rows={4}
          id="invitation_text"
          name="invitation_text"
          label={'Invitation text'}
          type="text"
          inputRef={invitationText}
          defaultValue={community.invitation_text}
          onChange={checkIntroChanged}
          fullWidth
          variant="outlined"
        />
        <Stack
          direction="row"
          spacing={2}
          sx={{ marginTop: '16px', marginBottom: '16px' }}
          justifyContent="end"
        >
          <Button variant="outlined" disabled={!introChanged} type="sumbit">
            Update
          </Button>
        </Stack>
      </Stack>
      <Stack direction="row" spacing={2} justifyContent="end">
        <Button onClick={prevStep}>Go Back</Button>
        {needToInvite ? (
          <Fragment>
            <Button onClick={gotoCommunity}>Skip</Button>
            <Button variant="contained" onClick={showInvitations}>
              Invite
            </Button>
          </Fragment>
        ) : (
          <Button variant="contained" onClick={gotoCommunity}>
            Done
          </Button>
        )}
      </Stack>
      <ConfirmDialog
        control={cancelDialog}
        onConfirm={cancelIntro}
        title="Discard changes"
        text="Are you sure you want to discard your changes?"
        action="Yes"
      />
      <InvitationsDialog
        control={invitationsDialog}
        community={community}
        members={inviteMembers}
      />
    </Stack>
  );
};
export default CommunityIntro;
