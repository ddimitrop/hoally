import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Avatar from '@mui/material/Avatar';
import PersonIcon from '@mui/icons-material/Person';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import { useState, Fragment } from 'react';
import AddMember from './AddMember.js';
import { Info } from './Utils.js';
import ConfirmDialog from './ConfirmDialog.js';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import { flagState } from './state-utils.js';

const CommunityMembers = ({ stepper, members }) => {
  let [memberEdit, setMemberEdit] = useState(null);
  let [memberAdd, setMemberAdd] = useState(false);
  let [memberChanged, setMemberChanged] = useState(false);
  let [onCancel, setOnCancel] = useState({ callback: () => {} });
  const cancelDialog = flagState(useState(false));
  let [deleteIndex, setDeleteIndex] = useState(null);
  const deleteDialog = flagState(useState(false));

  const checkChange = (callback) => {
    if (memberChanged) {
      setOnCancel({ callback });
      cancelDialog.open();
    } else {
      callback();
    }
  };

  const nextStep = () => {
    checkChange(() => {
      setMemberEdit(null);
      setMemberAdd(false);
      stepper.next();
    });
  };

  const prevStep = () => {
    checkChange(() => {
      setMemberEdit(null);
      setMemberAdd(false);
      stepper.prev();
    });
  };

  const addresses = () => members.map((m) => m.address);

  const addMember = () => {
    checkChange(() => {
      setMemberEdit(null);
      setMemberAdd(true);
    });
  };

  const editDone = (member, isNew) => {
    if (member && isNew) {
      members.push(member);
    }
    setMemberAdd(false);
    setMemberEdit(null);
    setMemberChanged(false);
    if (isNew) {
      setTimeout(() => setMemberAdd(true), 0);
    }
  };

  const cancelMember = () => {
    editDone();
    cancelDialog.close();
    onCancel.callback();
  };

  const editMember = (i) => {
    checkChange(() => {
      setMemberEdit(i);
      setMemberAdd(false);
    });
  };

  const confirmDelete = (i) => {
    setDeleteIndex(i);
    deleteDialog.open();
  };

  const deleteMember = () => {
    members.splice(deleteIndex, 1);
    setDeleteIndex(null);
  };

  const latestAddress = () => members?.[members?.length - 1].address;

  const invitationTooltip = (member) => {
    return [member.invitation_full_name, member.invitation_email]
      .filter((v) => !!v)
      .join(' - ');
  };

  return (
    <Fragment>
      <Stack spacing={1} sx={{ flexGrow: '1' }}>
        <Container sx={{ flexGrow: '1', overflow: 'scroll' }}>
          <List>
            {members.map((member, i) =>
              memberEdit === i ? (
                <ListItem key={member.id}>
                  <AddMember
                    done={editDone}
                    member={member}
                    addresses={addresses()}
                    setChanged={setMemberChanged}
                  />
                </ListItem>
              ) : (
                <ListItem
                  key={member.id}
                  secondaryAction={
                    <Box>
                      <IconButton
                        edge="end"
                        onClick={() => editMember(i)}
                        aria-label="edit"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        onClick={() => confirmDelete(i)}
                        aria-label="delete"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemAvatar>
                    <Avatar>
                      <PersonIcon color="primary" />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginRight: '18px',
                        }}
                      >
                        {member.address}
                        <Box
                          sx={{
                            paddingRight: ['0', '0', '16px', '16px', '16px'],
                          }}
                        >
                          {member.is_board_member ? (
                            <Info
                              sx={{ marginLeft: '12px' }}
                              title="The user is a board member of this community"
                              icon="people_alt"
                            />
                          ) : (
                            ''
                          )}
                          {member.is_moderator ? (
                            <Info
                              sx={{ marginLeft: '12px' }}
                              title="The user is a moderator of this community"
                              icon="local_police"
                            />
                          ) : (
                            ''
                          )}
                          {member.is_admin ? (
                            <Info
                              sx={{ marginLeft: '12px' }}
                              title="The user is an administrator of this community"
                              icon="manage_accounts"
                            />
                          ) : (
                            ''
                          )}
                        </Box>
                      </Box>
                    }
                    secondary={
                      member.name || (
                        <Tooltip title={invitationTooltip(member)}>
                          Not assigned
                        </Tooltip>
                      )
                    }
                  />
                </ListItem>
              ),
            )}
          </List>
          <Divider />
          <Box
            sx={{
              flexGrow: '1',
              display: 'flex',
              justifyContent: 'end',
              padding: '16px 0',
            }}
          >
            {memberAdd ? (
              <AddMember
                done={editDone}
                member={{ address: latestAddress() }}
                addresses={addresses()}
                setChanged={setMemberChanged}
              />
            ) : (
              <Button variant="outlined" onClick={addMember}>
                Add members
              </Button>
            )}
          </Box>
        </Container>
        <Stack direction="row" spacing={2} justifyContent="end">
          <Button onClick={prevStep}>Go Back</Button>
          <Button variant="contained" onClick={nextStep}>
            Next
          </Button>
        </Stack>
        <ConfirmDialog
          control={cancelDialog}
          onConfirm={cancelMember}
          title="Discard changes"
          text="Are you sure you want to discard your changes?"
          action="Yes"
        />
      </Stack>
      <DeleteConfirmDialog
        control={deleteDialog}
        onDelete={() => {
          deleteMember();
        }}
        deleteApiPath={`/api/member/${members[deleteIndex]?.id}`}
        deleteTitle="Delete member ?"
        deleteText="Deleting this community member would make its posts and votes anonymous."
      />
    </Fragment>
  );
};

export default CommunityMembers;
