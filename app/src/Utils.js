import Icon from '@mui/material/Icon';
import IconButton from '@mui/material/IconButton';
import Fade from '@mui/material/Fade';
import Tooltip from '@mui/material/Tooltip';

export const Info = ({ title, icon = 'info' }) => {
  return (
    <Tooltip
      enterTouchDelay={100}
      TransitionComponent={Fade}
      TransitionProps={{ timeout: 600 }}
      title={title}
    >
      <IconButton variant="outlined" size="small">
        <Icon fontSize="small"> {icon} </Icon>
      </IconButton>
    </Tooltip>
  );
};
