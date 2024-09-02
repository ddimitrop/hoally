import Stack from '@mui/material/Stack';
import Fab from '@mui/material/Fab';
import Box from '@mui/material/Box';
import MapsHomeWorkTwoToneIcon from '@mui/icons-material/MapsHomeWorkTwoTone';
import HolidayVillageTwoToneIcon from '@mui/icons-material/HolidayVillageTwoTone';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import PreviewTwoToneIcon from '@mui/icons-material/PreviewTwoTone';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import ListSubheader from '@mui/material/ListSubheader';
import Typography from '@mui/material/Typography';
import { Global } from './Global.js';
import { useNavigate, useLoaderData } from 'react-router-dom';
import { useState, useEffect, useContext, Fragment } from 'react';
import { getData } from './json-utils.js';
import { Info } from './Utils.js';
import { postData } from './json-utils.js';

const CommunityList = () => {
  const global = useContext(Global);
  const navigate = useNavigate();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [communitiesList, setCommunitiesList] = useState([]);

  const editCommunity = (i) => {
    navigate(`${i}`);
  };

  const goToCommunity = (i) => {
    const { id: communityId } = communities[i];
    setSelectedIndex(i);
    return postData('/api/hoauser/default', { communityId }).then(() => {
      const currentUser = global.getCurrentUser();
      currentUser.default_community = communityId;
      global.loadHoaUser(currentUser);
      navigate(`/topic/${communityId}`);
    });
  };

  const selectDefaultCommunity = () => {
    const defaultCommunityId = global.getCurrentUser().default_community;
    if (defaultCommunityId != null) {
      const defaultIndex = communities.findIndex(
        (community) => community.id === defaultCommunityId,
      );
      if (defaultIndex != null) {
        setSelectedIndex(defaultIndex);
      }
    }
  };

  const communities = useLoaderData();
  const { error } = communities;
  if (error) {
    global.setAppError(error);
  }

  useEffect(() => {
    setCommunitiesList(communities);
    selectDefaultCommunity();
  }, [communities]);

  return (
    <Stack spacing={2}>
      {false ? (
        <Stack direction="row" justifyContent="center">
          <TextField
            id="outlined-basic"
            label="Search communities"
            variant="outlined"
            fullWidth
          />
        </Stack>
      ) : (
        ''
      )}
      <List sx={{ flexGrow: '1' }}>
        <ListSubheader component="div" id="nested-list-subheader">
          <Typography variant="h6">My communities</Typography>
        </ListSubheader>
        {communitiesList.map((community, i) => (
          <ListItem
            key={community.id}
            secondaryAction={
              <IconButton
                edge="end"
                aria-label="edit"
                onClick={() => editCommunity(community.id)}
              >
                {community.is_admin ? (
                  <EditOutlinedIcon />
                ) : (
                  <PreviewTwoToneIcon />
                )}
              </IconButton>
            }
          >
            <ListItemButton
              selected={selectedIndex === i}
              onClick={() => goToCommunity(i)}
            >
              <ListItemIcon sx={{ display: { xs: 'none', sm: 'block' } }}>
                <HolidayVillageTwoToneIcon fontSize="large" />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    {community.name}
                    <Box>
                      <MemberRoles member={community} />
                    </Box>
                  </Box>
                }
                secondary={
                  <Typography>
                    {`${community.address}, ${community.city}`} <br />
                    {`(${community.num_members}) properties, 
                            (${community.num_registered_members}) registered`}
                  </Typography>
                }
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Stack direction="row" justifyContent="end">
        <Fab
          color="primary"
          variant="extended"
          onClick={() => {
            navigate('create');
          }}
        >
          <MapsHomeWorkTwoToneIcon sx={{ mr: 1 }} />
          Create community
        </Fab>
      </Stack>
    </Stack>
  );
};

export async function communitiesLoader() {
  try {
    return await getData('/api/community');
  } catch ({ message: error }) {
    return { error };
  }
}

export const MemberRoles = ({ member }) => {
  return (
    <Fragment>
      {member.is_board_member ? (
        <Info
          sx={{ marginLeft: '12px' }}
          title="The user is a board member: can archive topics and has no limits on posts."
          icon="people_alt"
        />
      ) : (
        ''
      )}
      {member.is_moderator ? (
        <Info
          sx={{ marginLeft: '12px' }}
          title="The user is a moderator: can hide topics that do not respect the community guidelines."
          icon="local_police"
        />
      ) : (
        ''
      )}
      {member.is_observer ? (
        <Info
          sx={{ marginLeft: '12px' }}
          title="The user is an observer: can view and post topics and comments but has no right to vote."
          icon="visibility_outlined"
        />
      ) : (
        ''
      )}
      {member.is_admin ? (
        <Info
          sx={{ marginLeft: '12px' }}
          title="The user is an administrator: can add members and change their roles."
          icon="manage_accounts"
        />
      ) : (
        ''
      )}
    </Fragment>
  );
};

export default CommunityList;
