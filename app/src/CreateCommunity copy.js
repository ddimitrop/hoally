import Container from '@mui/material/Container';
import Checkbox from '@mui/material/Checkbox';
import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import Avatar from '@mui/material/Avatar';
import PersonIcon from '@mui/icons-material/Person';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import LocalPoliceIcon from '@mui/icons-material/LocalPolice';
import Button from '@mui/material/Button';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import SlideContents from './SlideContents.js';
import { useContext, useEffect, useState, useRef, Fragment } from 'react';
import { useNavigate, useLoaderData } from 'react-router-dom';
import {
  useValidation,
  getFormData,
  flagState,
  hasModifications,
} from './state-utils.js';
import { states } from './data-utils.js';
import ConfirmDialog from './ConfirmDialog.js';
import MapsAutoComplete from './MapsAutoComplete.js';
import { postData, getData } from './json-utils.js';
import { Global } from './Global.js';

let moveNext = false;

const CreateCommunity = () => {
  const global = useContext(Global);
  let [step, setStep] = useState(0);
  const nextStep = () => {
    setStep(step + 1);
  };
  const prevStep = () => {
    setStep(step - 1);
  };

  useEffect(() => {
    if (moveNext) {
      nextStep();
      moveNext = false;
    }
  });

  const navigate = useNavigate();
  const cancelDialog = flagState(useState(false));
  const createForm = useRef(null);
  const zip = useValidation(' 12345[-6789]');
  const state = useValidation(' code');

  const data = useLoaderData() || {};
  const community = data.community || {};
  const members = data.members || [];
  if (data.error) {
    global.setAppError(data.error);
  }

  const [cityValue, setCityValue] = useState(community.city || '');
  const [stateValue, setStateValue] = useState(community.state || '');
  const [zipValue, setZipValue] = useState(community.zipcode || '');

  const deleteDialog = flagState(useState(false));

  const { error } = community;
  if (error) {
    global.setAppError(error);
  }

  const isNewCommunity = () => !community.id;

  const needsUpdate = () => {
    const newData = getFormData(createForm.current);
    return hasModifications(community, newData);
  };

  const cancelCommunity = () => {
    navigate('/community');
  };

  const cancel = () => {
    if (needsUpdate()) {
      cancelDialog.open();
    } else {
      cancelCommunity();
    }
  };

  const communityNext = () => {
    if (needsUpdate()) {
      saveCommunity().then((ok) => {
        moveNext = true;
      });
    } else {
      nextStep();
    }
  };

  const saveCommunity = () => {
    const isNew = isNewCommunity();
    const data = getFormData(createForm.current);
    data.id = community.id;
    return postData('/api/community', data, isNew ? 'POST' : 'PUT')
      .then(({ community: savedCommunity }) => {
        if (isNew) {
          navigate(`/community/${savedCommunity.id}`);
        } else {
          navigate('.', { replace: true });
        }
        return true;
      })
      .catch((e) => {
        global.setAppError(e.message);
      });
  };

  const showDeleteCommunity = () => {
    deleteDialog.open();
  };

  const addMemberForm = useRef(null);
  let [memberEdit, setMemberEdit] = useState(null);
  let [memberAdd, setMemberAdd] = useState(false);

  return (
    <Fragment>
      <Stack spacing={1} sx={{ maxWidth: 'sm' }}>
        <Stepper activeStep={step} alternativeLabel>
          <Step key={1}>
            <StepLabel>Community</StepLabel>
          </Step>
          <Step key={2}>
            <StepLabel>Members</StepLabel>
          </Step>
          <Step key={3}>
            <StepLabel>Invitations</StepLabel>
          </Step>
        </Stepper>
        <Stack sx={{ flexGrow: '1' }}>
          <SlideContents step={step}>
            {/* ------------------------- Community ------------------------- */}
            <Stack
              component="form"
              spacing={1}
              sx={{ flexGrow: '1' }}
              ref={createForm}
              onSubmit={(event) => {
                event.preventDefault();
                communityNext();
              }}
            >
              <Box sx={{ flexGrow: '1' }}>
                <Grid
                  container
                  spacing={1}
                  sx={{ flexGrow: '1', maxWidth: 'sm' }}
                >
                  <Grid item xs={12}>
                    <TextField
                      required
                      margin="dense"
                      id="name"
                      name="name"
                      label="Community name"
                      defaultValue={community.name || ''}
                      fullWidth
                      autoComplete="no-auto-complete"
                      variant="standard"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      required
                      margin="dense"
                      id="admin_address"
                      name="admin_address"
                      label="Your address in the community"
                      defaultValue={community.admin_address || ''}
                      fullWidth
                      variant="standard"
                      autoComplete="street-address"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <MapsAutoComplete
                      textFieldProps={{
                        required: true,
                        margin: 'dense',
                        id: 'address',
                        name: 'address',
                        label: 'Main community address',
                        fullWidth: true,
                        variant: 'standard',
                        autoComplete: 'new-password',
                      }}
                      initValue={community.address || ''}
                      onSelect={(city, state, zip) => {
                        setCityValue(city);
                        setStateValue(state);
                        setZipValue(zip);
                      }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      required
                      margin="dense"
                      id="city"
                      name="city"
                      label="City"
                      value={cityValue}
                      fullWidth
                      variant="standard"
                      onChange={(e) => setCityValue(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      required
                      error={!state.isValid()}
                      margin="dense"
                      id="state"
                      name="state"
                      inputProps={{ pattern: `(${states.join('|')})` }}
                      label={`State${state.invalidMessage()}`}
                      value={stateValue}
                      onBlur={(event) => state.validate(event.currentTarget)}
                      fullWidth
                      autoComplete="address-level1"
                      variant="standard"
                      onChange={(e) => setStateValue(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      required
                      error={!zip.isValid()}
                      margin="dense"
                      id="zipcode"
                      name="zipcode"
                      label={`Zipcode${zip.invalidMessage()}`}
                      value={zipValue}
                      type="text"
                      inputProps={{ pattern: '[0-9]{5}(-[0-9]{4})?' }}
                      autoComplete="postal-code"
                      onBlur={(event) => zip.validate(event.currentTarget)}
                      fullWidth
                      variant="standard"
                      onChange={(e) => setZipValue(e.target.value)}
                    />
                  </Grid>
                </Grid>
              </Box>
              <Stack direction="row" spacing={2} justifyContent="end">
                {community.id ? (
                  <Button color="error" onClick={showDeleteCommunity}>
                    Delete community
                  </Button>
                ) : (
                  ''
                )}
                <Box sx={{ flex: 1 }}></Box>
                <Button onClick={cancel}>Cancel</Button>
                <Button variant="contained" type="submit">
                  Next
                </Button>
              </Stack>
            </Stack>

            {/* ------------------------- Members ------------------------- */}
            <Stack spacing={1} sx={{ flexGrow: '1' }}>
              <Container sx={{ flexGrow: '1' }}>
                <List>
                  {members.map((member, i) => (
                    <ListItem
                      key={member.id}
                      secondaryAction={
                        <IconButton edge="end" aria-label="edit">
                          <EditIcon />
                        </IconButton>
                      }
                    >
                      <ListItemAvatar>
                        <Avatar>
                          <PersonIcon color="primary" />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            {member.address}
                            <Box sx={{ paddingRight: '24px' }}>
                              {member.is_board_member ? (
                                <PeopleAltIcon
                                  color="action"
                                  sx={{ marginLeft: '12px' }}
                                  fontSize="xs"
                                />
                              ) : (
                                ''
                              )}
                              {member.is_moderator ? (
                                <LocalPoliceIcon
                                  color="action"
                                  sx={{ marginLeft: '12px' }}
                                  fontSize="xs"
                                />
                              ) : (
                                ''
                              )}
                              {member.is_admin ? (
                                <ManageAccountsIcon
                                  color="action"
                                  sx={{ marginLeft: '12px' }}
                                  fontSize="xs"
                                />
                              ) : (
                                ''
                              )}
                            </Box>
                          </Typography>
                        }
                        secondary={member.name || 'Not assigned'}
                      />
                    </ListItem>
                  ))}
                </List>
                <Box
                  sx={{ flexGrow: '1', display: 'flex', justifyContent: 'end' }}
                >
                  {memberAdd ? (
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
                          defaultValue={''}
                          fullWidth
                          autoComplete="no-auto-complete"
                          variant="standard"
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          margin="dense"
                          id="invitation_name"
                          name="invitation_name"
                          label="Invitation name"
                          defaultValue={''}
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
                          defaultValue={''}
                          fullWidth
                          autoComplete="no-auto-complete"
                          variant="standard"
                        />
                      </Grid>
                      <Grid item xs={9}>
                        <FormControlLabel
                          control={<Checkbox defaultChecked={false} />}
                          label="Board member"
                        />
                        <FormControlLabel
                          control={<Checkbox defaultChecked={false} />}
                          label="Moderator"
                        />
                        <FormControlLabel
                          control={<Checkbox defaultChecked={false} />}
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
                        }}
                      >
                        <Button
                          variant="outlined"
                          onClick={() => {
                            setMemberAdd(false);
                          }}
                        >
                          Save
                        </Button>
                      </Grid>
                    </Grid>
                  ) : (
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setMemberAdd(true);
                      }}
                    >
                      Add member
                    </Button>
                  )}
                </Box>
              </Container>
              <Stack direction="row" spacing={2} justifyContent="end">
                <Button onClick={() => prevStep()}>Go Back</Button>
                <Button variant="contained" onClick={() => nextStep(2)}>
                  Next
                </Button>
              </Stack>
            </Stack>

            {/* ------------------------- Invitation ------------------------- */}
            <Stack spacing={1} sx={{ flexGrow: '1' }}>
              <Container sx={{ flexGrow: '1' }}></Container>
              <Stack direction="row" spacing={2} justifyContent="end">
                <Button onClick={() => prevStep()}>Go Back</Button>
                <Button onClick={cancel}>Skip</Button>
                <Button variant="contained" onClick={() => prevStep(1)}>
                  Invite
                </Button>
              </Stack>
            </Stack>
          </SlideContents>
        </Stack>
      </Stack>
      <ConfirmDialog
        control={cancelDialog}
        onConfirm={cancelCommunity}
        title="Discard changes"
        text="Are you sure you want to discard your changes?"
        action="Yes"
      />
      <DeleteConfirmDialog
        control={deleteDialog}
        onDelete={() => {
          cancelCommunity();
        }}
        deleteApiPath={`/api/community/${community.id}`}
        deleteTitle="Delete community"
        deleteText={
          <span>
            Are you sure about this? <br />
            Deleting your community will also delete all community members and
            posts. <b>It cannot be undone.</b>
          </span>
        }
        deleteSuccessText="Your community was deleted succesfully"
      />
    </Fragment>
  );
};

export async function communityLoader({ params: { id } }) {
  try {
    const community = await getData(`/api/community/${id}`);
    const members = await getData(`/api/member/${id}`);
    return { community, members };
  } catch ({ message: error }) {
    return { error };
  }
}

export default CreateCommunity;
