import Box from '@mui/material/Box';
import Slide from '@mui/material/Slide';
import { usePrevious } from './state-utils.js';

const SlideContents = ({ children, step }) => {
  const init = step;
  const previousStep = usePrevious(step, init - 1);

  return (
    <Box sx={{ flexGrow: '1', position: 'relative' }}>
      {children.map((child, i) => {
        let direction;
        if (step >= previousStep) {
          direction = step === i ? 'left' : 'right';
        } else {
          direction = step === i ? 'right' : 'left';
        }
        return (
          <Slide key={i} in={step === i} direction={direction}>
            <Box
              sx={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                display: 'flex',
              }}
            >
              {child}
            </Box>
          </Slide>
        );
      })}
    </Box>
  );
};

export default SlideContents;
