import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import { useContext, useState, useRef, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useValidation,
  getFormData,
  flagState,
  hasModifications,
} from './state-utils.js';
import { states } from './data-utils.js';
import ConfirmDialog from './ConfirmDialog.js';
import MapsAutoComplete from './MapsAutoComplete.js';
import { postData } from './json-utils.js';
import { Global } from './Global.js';
import { Info } from './Utils.js';

const CommunityDetails = ({ stepper, community, moveNext }) => {
  const global = useContext(Global);

  const navigate = useNavigate();
  const cancelDialog = flagState(useState(false));
  const createForm = useRef(null);
  const zip = useValidation(' 12345[-6789]');
  const state = useValidation(' code');

  const [cityValue, setCityValue] = useState(community.city || '');
  const [stateValue, setStateValue] = useState(community.state || '');
  const [zipValue, setZipValue] = useState(community.zipcode || '');

  const deleteDialog = flagState(useState(false));

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
        if (ok) moveNext();
      });
    } else {
      stepper.next();
    }
  };

  const saveCommunity = () => {
    const isNew = isNewCommunity();
    const data = getFormData(createForm.current);
    data.id = community.id;
    return postData('/api/community', data, isNew ? 'POST' : 'PUT')
      .then(({ community: savedCommunity, appError }) => {
        if (appError) {
          global.setAppError(appError);
          return false;
        }
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

  return (
    <Fragment>
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
          <Grid container spacing={1} sx={{ flexGrow: '1', maxWidth: 'sm' }}>
            <Grid item xs={12} sx={{ display: 'flex', alignItems: 'end' }}>
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
                InputProps={{
                  readOnly: !community.is_admin,
                }}
              />
              <Info title="The official name of the community" />
            </Grid>
            <Grid item xs={12} sx={{ display: 'flex', alignItems: 'end' }}>
              <Box sx={{ flexGrow: '1' }}>
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
                  readOnly={!community.is_admin}
                  initValue={community.address || ''}
                  onSelect={(city, state, zip) => {
                    setCityValue(city);
                    setStateValue(state);
                    setZipValue(zip);
                  }}
                />
              </Box>
              <Info
                title="The main address (street number) of the community 
                      (i.e. reception, clubhouse etc.)"
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
                InputProps={{
                  readOnly: !community.is_admin,
                }}
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
                InputProps={{
                  readOnly: !community.is_admin,
                }}
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
                InputProps={{
                  readOnly: !community.is_admin,
                }}
                onChange={(e) => setZipValue(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sx={{ display: 'flex', alignItems: 'end' }}>
              <TextField
                required
                margin="dense"
                id="admin_address"
                name="admin_address"
                label="Your address in the community"
                defaultValue={community.admin_address || ''}
                fullWidth
                variant="standard"
                InputProps={{
                  readOnly: !community.is_admin,
                }}
                autoComplete="street-address"
              />
              <Info
                title="Your own address (street number) in the community. 
                      You will be an admin and the first member"
              />
            </Grid>
          </Grid>
        </Box>
        <Stack
          direction="row"
          spacing={2}
          justifyContent="end"
          alignItems="center"
        >
          {community.id && community.is_admin ? (
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

export default CommunityDetails;
