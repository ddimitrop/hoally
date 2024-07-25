import Stack from '@mui/material/Stack';
import Fab from '@mui/material/Fab';
import MapsHomeWorkTwoToneIcon from '@mui/icons-material/MapsHomeWorkTwoTone';
import HolidayVillageTwoToneIcon from '@mui/icons-material/HolidayVillageTwoTone';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import ListSubheader from '@mui/material/ListSubheader';
import Typography from '@mui/material/Typography';
import { useNavigate, useLoaderData } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getData } from './json-utils.js';

const CommunityList = () => {
  const navigate = useNavigate();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [communitiesList, setCommunitiesList] = useState([]);

  const editCommunity = (i) => {
    navigate(`${i}`);
  };

  const communities = useLoaderData();
  useEffect(() => {
    setCommunitiesList(communities);
  }, [communities]);

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="center">
        <TextField
          id="outlined-basic"
          label="Search communities"
          variant="outlined"
          fullWidth
        />
      </Stack>
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
                aria-label="delete"
                onClick={() => editCommunity(community.id)}
              >
                <EditOutlinedIcon />
              </IconButton>
            }
          >
            <ListItemButton
              selected={selectedIndex === i}
              onClick={() => setSelectedIndex(i)}
            >
              <ListItemIcon>
                <HolidayVillageTwoToneIcon fontSize="large" />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    {community.name}
                    {community.is_admin ? (
                      <ManageAccountsIcon
                        color="action"
                        sx={{ marginLeft: '12px' }}
                        fontSize="xs"
                      />
                    ) : (
                      ''
                    )}
                  </Typography>
                }
                secondary={`${community.address}, ${community.city}`}
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

export default CommunityList;
