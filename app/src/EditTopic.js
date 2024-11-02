import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import ChipSelect from './ChipSelect.js';
import UploadButton, { clearImage } from './UploadButton.js';
import { Global } from './Global.js';
import { useRef, useContext, useState, Fragment } from 'react';
import { hasModifications, flagState, changeProtect } from './state-utils';
import { useParams, useLoaderData, useNavigate } from 'react-router-dom';
import { useDefaultNavigate } from './Navigate.js';
import { postData, getData } from './json-utils.js';
import ClearIcon from '@mui/icons-material/Clear';
import Attachements from './Attachments.js';
import ConfirmDialog from './ConfirmDialog.js';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import { NO_AUTHENTICATION_COOKIE } from './errors.mjs';

const EditTopic = () => {
  const global = useContext(Global);
  const addTopicForm = useRef(null);
  const subject = useRef(null);
  const description = useRef(null);
  const navigate = useNavigate();
  const defaultNavigate = useDefaultNavigate();
  const { communityId, topicId } = useParams();
  const emptyProposition = () => ({ description: '', images: [] });
  const deleteDialog = flagState(useState(false));
  const cancelDialog = flagState(useState(false));
  const [hasRedirect, setHasRedirect] = useState(false);
  const protect = changeProtect(
    useState(false),
    useState(),
    useState(),
    cancelDialog,
  );
  const MAX_PROPOSITIONS = 5;

  const isNewTopic = () => !topic.id;

  const TOPIC_TAGS = [
    'complaints',
    'ideas',
    'garden',
    'maintenance',
    'fees',
    'fines',
    'pool',
    'trees',
    'parking',
  ];

  const data = useLoaderData();

  let { member, topic } = data;
  let errorMessage = data.error;
  if (!member) member = {};
  if (!topic) topic = { proposition: [], tags: [], images: [] };
  for (const part of [member, topic]) {
    const { error, appError } = part;
    errorMessage ||= error || appError;
  }
  if (errorMessage) {
    if (errorMessage !== NO_AUTHENTICATION_COOKIE) {
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
    member = {};
    topic = { proposition: [], tags: [], images: [] };
  }

  const [type, setType] = useState(topic.type);
  let [tags, setTags] = useState(topic.tags || []);
  let [images, setImages] = useState(topic.images || []);
  let [propositions, setPropositions] = useState(
    topic.propositions || [emptyProposition()],
  );

  const getFormData = () => {
    return {
      subject: subject.current.value,
      description: description.current.value,
      type,
      tags,
      propositions,
      images,
    };
  };

  const handleTypeChange = (event) => {
    setType(event.target.value);
    checkWasChanged();
  };

  const handleTagsChange = (newTags) => {
    while (newTags.length > 10) {
      newTags.shift();
    }
    tags = newTags;
    setTags(newTags);
    checkWasChanged();
  };

  const checkWasChanged = () => {
    const changed = hasModifications(topic, getFormData());
    protect.setChanged(changed);
  };

  const changeVoteDescription = (i, event) => {
    const newPropositions = [...propositions];
    newPropositions[i] = {
      ...propositions[i],
      description: event.target.value,
    };
    propositions = newPropositions;
    setPropositions(newPropositions);
    checkWasChanged();
  };

  const addProposition = () => {
    const newPropositions = [...propositions, emptyProposition()];
    propositions = newPropositions;
    setPropositions(newPropositions);
    checkWasChanged();
  };

  const clearProposition = (i) => {
    const clearedPropositions = [...propositions];
    clearedPropositions.splice(i, 1);
    propositions = clearedPropositions;
    setPropositions(clearedPropositions);
    checkWasChanged();
  };

  const saveTopic = () => {
    const isNew = isNewTopic();
    const data = getFormData();
    data.id = topic.id;
    data.member_id = member.id;
    return postData(`/api/topic/${communityId}`, data, isNew ? 'POST' : 'PUT')
      .then(({ appError, topic: savedTopic }) => {
        if (appError) {
          global.setAppError(appError);
        } else {
          goToCommunity();
        }
      })
      .catch((e) => {
        global.setAppError(e.message);
      });
  };

  const hasAddButton = (i) =>
    i === propositions.length - 1 && MAX_PROPOSITIONS > propositions.length;

  const imageUpload = (fileName) => {
    images.push(fileName);
    setImages([...images]);
  };

  const propImageUpload = (i, fileName) => {
    propositions[i].images = [...propositions[i].images, fileName];
    setPropositions([...propositions]);
  };

  const removeImage = (i) => {
    const filename = images[i];
    clearImage(filename);
    images.splice(i, 1);
    setImages([...images]);
  };

  const removePropImage = (i) => (j) => {
    const images = propositions[i].images;
    const filename = images[j];
    clearImage('topic', filename);
    images.splice(j, 1);
    propositions[i].images = [...images];
    setPropositions([...propositions]);
  };

  const confirmDelete = (i) => {
    protect.checkChange(() => {
      deleteDialog.open();
    });
  };

  const cancel = () => {
    protect.checkChange(() => {
      if (topic.id) {
        goToViewTopic();
      } else {
        goToCommunity();
      }
    });
  };

  const goToViewTopic = () => {
    navigate(`/topic/${communityId}/view/${topic.id}`);
  };

  const goToCommunity = () => {
    navigate(`/topic/${communityId}`);
  };

  return member.id ? (
    <Stack sx={{ maxWidth: '750px', padding: '0 8px' }}>
      <Grid
        ref={addTopicForm}
        component="form"
        container
        sx={{ flexGrow: '0' }}
        onSubmit={(event) => {
          event.preventDefault();
          saveTopic();
        }}
      >
        <Grid item md={9} xs={7}>
          <TextField
            required
            margin="dense"
            id="subject"
            name="subject"
            label="Subject"
            defaultValue={topic.subject}
            fullWidth
            autoComplete="no-auto-complete"
            variant="standard"
            size="small"
            autoFocus
            inputRef={subject}
            onChange={checkWasChanged}
          />
        </Grid>
        <Grid
          item
          md={3}
          xs={5}
          sx={{ display: 'flex', justifyContent: 'end', alignItems: 'end' }}
        >
          <FormControl size="small" dense="none">
            <InputLabel id="topic-type">Type</InputLabel>
            <Select
              labelId="topic-type"
              value={type}
              label="Type"
              size="small"
              onChange={handleTypeChange}
            >
              <MenuItem value={'announcement'}>Announcement</MenuItem>
              <MenuItem value={'proposition'}>Proposition</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item md={9} xs={7}>
          <div style={{ display: 'flex', alignItems: 'end' }}>
            <TextField
              margin="dense"
              id="description"
              name="description"
              label="Details"
              defaultValue={topic.description}
              multiline
              maxRows={4}
              autoComplete="no-auto-complete"
              variant="standard"
              size="small"
              inputRef={description}
              onChange={checkWasChanged}
              sx={{ flexGrow: '1' }}
            />
            {images.length < 8 ? (
              <UploadButton done={imageUpload}></UploadButton>
            ) : (
              ''
            )}
          </div>
          <div>
            <Attachements
              prefix={`topic/${topic.id}`}
              images={images}
              small={false}
              removeImage={removeImage}
            />
          </div>
        </Grid>
        <Grid item md={3} xs={5}></Grid>
        {type === 'proposition'
          ? propositions.map((proposition, i) => (
              <Fragment key={i}>
                <Grid item md={9} xs={7}>
                  <div style={{ display: 'flex', alignItems: 'end' }}>
                    <TextField
                      margin="dense"
                      id={`vote_description_${i}`}
                      name={`vote_description_${i}`}
                      required
                      label={
                        propositions.length > 1
                          ? 'Proposition option'
                          : 'Proposition'
                      }
                      fullWidth
                      value={proposition.description}
                      autoComplete="no-auto-complete"
                      variant="standard"
                      size="small"
                      onChange={(event) => changeVoteDescription(i, event)}
                    />
                    {proposition.images.length < 8 ? (
                      <UploadButton
                        done={(fileName) => propImageUpload(i, fileName)}
                      ></UploadButton>
                    ) : (
                      ''
                    )}
                  </div>
                  <div>
                    <Attachements
                      prefix={`topic/${topic.id}`}
                      images={proposition.images}
                      small={false}
                      removeImage={removePropImage(i)}
                    />
                  </div>
                </Grid>
                <Grid
                  item
                  md={3}
                  xs={5}
                  style={{
                    display: 'flex',
                    justifyContent: 'end',
                    alignItems: 'end',
                  }}
                >
                  {hasAddButton(i) ? (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={addProposition}
                    >
                      Add option
                    </Button>
                  ) : (
                    <IconButton onClick={() => clearProposition(i)}>
                      <ClearIcon />
                    </IconButton>
                  )}
                </Grid>
              </Fragment>
            ))
          : ''}
        <Grid item md={8} xs={4}>
          <ChipSelect
            options={TOPIC_TAGS}
            id="topic-tags"
            label="Tags"
            value={tags}
            onChange={handleTagsChange}
          />
        </Grid>
        <Grid
          item
          md={4}
          xs={8}
          sx={{
            display: 'flex',
            justifyContent: 'end',
            alignItems: 'end',
            gap: { xs: '2px', sm: '12px' },
          }}
        >
          {!isNewTopic() ? (
            <Button
              size="small"
              color="error"
              onClick={() => {
                confirmDelete();
              }}
            >
              Delete
            </Button>
          ) : (
            ''
          )}
          <Button size="small" onClick={cancel}>
            Cancel
          </Button>
          <Button size="small" variant="contained" type="submit">
            {isNewTopic() ? 'Post' : 'Change'}
          </Button>
        </Grid>
      </Grid>
      <DeleteConfirmDialog
        control={deleteDialog}
        onDelete={goToCommunity}
        deleteApiPath={`/api/topic/${topicId}`}
        deleteTitle="Delete topic ?"
        deleteText="Deleting the topic can't be undone."
      />
      <ConfirmDialog
        control={cancelDialog}
        onConfirm={protect.onConfirm}
        title="Discard changes"
        text="Are you sure you want to discard your changes?"
        action="Yes"
      />
      <div style={{ flexGrow: '1', minHeight: '32px' }}></div>
    </Stack>
  ) : (
    ''
  );
};

export default EditTopic;

export async function editTopicLoader({ params: { communityId, topicId } }) {
  const member = await getData(`/api/member/user/${communityId}`);
  let topic = { type: 'proposition' };
  if (topicId !== 'new') {
    topic = await getData(`/api/topic/${communityId}/${topicId}`);
  }
  return { topic, member };
}
