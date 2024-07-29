import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

const CommunityInvitations = ({ stepper }) => {
  return (
    <Stack spacing={1} sx={{ flexGrow: '1' }}>
      <Container sx={{ flexGrow: '1' }}></Container>
      <Stack direction="row" spacing={2} justifyContent="end">
        <Button onClick={() => stepper.prev()}>Go Back</Button>
        <Button onClick={() => {}}>Skip</Button>
        <Button variant="contained" onClick={() => stepper.prev(1)}>
          Invite
        </Button>
      </Stack>
    </Stack>
  );
};
export default CommunityInvitations;
