import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Stack from '@mui/material/Stack';
import SlideContents from './SlideContents.js';
import { useState, useContext, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDefaultNavigate } from './Navigate.js';
import { useLoaderData } from 'react-router-dom';
import CommunityDetails from './CommunityDetails.js';
import CommunityMembers from './CommunityMembers.js';
import CommunityIntro from './CommunityIntro.js';
import { getData } from './json-utils.js';
import { useStepper } from './state-utils.js';
import { Global } from './Global.js';
import { NO_AUTHENTICATION_COOKIE } from './errors.mjs';

let moveNextOnLoad = false;

const CreateCommunity = () => {
  const global = useContext(Global);
  const navigate = useNavigate();
  const defaultNavigate = useDefaultNavigate();
  const stepper = useStepper(0);
  const [hasRedirect, setHasRedirect] = useState(false);

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

  let { community, members } = data;
  community = community || {};
  members = members || [];
  let errorMessage = data.error;
  for (const part of [community, members]) {
    const { error, appError } = part;
    errorMessage ||= error || appError;
  }
  if (errorMessage) {
    if (errorMessage != NO_AUTHENTICATION_COOKIE) {
      setTimeout(() => {
        if (!hasRedirect) {
          setHasRedirect(true);
          global.setAppError(errorMessage);
          global.customErrorClose(() => {
            defaultNavigate();
          });
        }
      }, 0);
    }
    community = {};
    members = [];
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
