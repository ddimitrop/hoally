import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Stack from '@mui/material/Stack';
import SlideContents from './SlideContents.js';
import { useContext, useEffect, Fragment } from 'react';
import { useLoaderData } from 'react-router-dom';
import CommunityDetails from './CommunityDetails.js';
import CommunityMembers from './CommunityMembers.js';
import CommunityIntro from './CommunityIntro.js';
import { getData } from './json-utils.js';
import { useStepper } from './state-utils.js';
import { Global } from './Global.js';

let moveNextOnLoad = false;

const CreateCommunity = () => {
  const global = useContext(Global);
  const stepper = useStepper(0);

  useEffect(() => {
    if (moveNextOnLoad) {
      stepper.next();
      moveNextOnLoad = false;
    }
  });

  const moveNext = () => {
    moveNextOnLoad = true;
  };

  const data = useLoaderData() || {};
  const community = data.community || {};
  const members = data.members || [];
  if (data.error) {
    global.setAppError(data.error);
  }

  const { error } = community;
  if (error) {
    global.setAppError(error);
  }

  const { error: membersError } = members;
  if (membersError) {
    global.setAppError(membersError);
  }

  return (
    <Fragment>
      <Stack spacing={1} sx={{ maxWidth: 'sm' }}>
        <Stepper activeStep={stepper.current()} alternativeLabel>
          <Step key={1}>
            <StepLabel>Community</StepLabel>
          </Step>
          <Step key={2}>
            <StepLabel>Members</StepLabel>
          </Step>
          <Step key={3}>
            <StepLabel>Intro</StepLabel>
          </Step>
        </Stepper>
        <Stack sx={{ flexGrow: '1' }}>
          <SlideContents step={stepper.current()}>
            <CommunityDetails
              stepper={stepper}
              community={community}
              moveNext={moveNext}
            />
            <CommunityMembers
              stepper={stepper}
              community={community}
              members={members}
            />
            <CommunityIntro
              stepper={stepper}
              community={community}
              members={members}
            />
          </SlideContents>
        </Stack>
      </Stack>
    </Fragment>
  );
};

export async function communityLoader({ params: { communityId } }) {
  try {
    const community = await getData(`/api/community/${communityId}`);
    const members = await getData(`/api/member/${communityId}`);
    return { community, members };
  } catch ({ message: error }) {
    return { error };
  }
}

export default CreateCommunity;
