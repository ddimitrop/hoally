import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import Avatar from '@mui/material/Avatar';
import PersonIcon from '@mui/icons-material/Person';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import { useState } from 'react';
import AddMember from './AddMember.js';
import { Info } from './Utils.js';

const CommunityMembers = ({ stepper, members }) => {
  let [memberAdd, setMemberAdd] = useState(false);

  const nextStep = () => {
    setMemberAdd(false);
    stepper.next();
  };

  const prevStep = () => {
    setMemberAdd(false);
    stepper.prev();
  };

  const latestAddress = () => members?.[members?.length - 1].address;

  return (
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
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    {member.address}
                    <Box
                      sx={{ paddingRight: ['0', '0', '16px', '16px', '16px'] }}
                    >
                      {member.is_board_member || true ? (
                        <Info
                          sx={{ marginLeft: '12px' }}
                          title="The user is a board member of this community"
                          icon="people_alt"
                        />
                      ) : (
                        ''
                      )}
                      {member.is_moderator || true ? (
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
                secondary={member.name || 'Not assigned'}
              />
            </ListItem>
          ))}
        </List>
        <Box sx={{ flexGrow: '1', display: 'flex', justifyContent: 'end' }}>
          {memberAdd ? (
            <AddMember
              done={() => setMemberAdd(false)}
              member={{ address: latestAddress() }}
            />
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
        <Button onClick={prevStep}>Go Back</Button>
        <Button variant="contained" onClick={nextStep}>
          Next
        </Button>
      </Stack>
    </Stack>
  );
};

export default CommunityMembers;
