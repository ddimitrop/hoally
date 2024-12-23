import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import ChipSelect from './ChipSelect.js';
import UploadButton, { clearImage } from './UploadButton.js';
import { Global } from './Global.js';
import { useRef, useContext, useState, Fragment } from 'react';
import { hasModifications } from './state-utils';
import { useParams } from 'react-router-dom';
import { postData } from './json-utils.js';
import ClearIcon from '@mui/icons-material/Clear';
import Attachements from './Attachments.js';

const AddTopic = ({ topic, confirmDelete, member, done, setChanged }) => {
  const global = useContext(Global);
  const addTopicForm = useRef(null);
  const subject = useRef(null);
  const description = useRef(null);
  const { communityId } = useParams();
  const [type, setType] = useState(topic.type);
  let [tags, setTags] = useState(topic.tags || []);
  const emptyProposition = () => ({ description: '', images: [] });
  let [propositions, setPropositions] = useState(
    topic.propositions || [emptyProposition()],
  );
  let [images, setImages] = useState(topic.images || []);
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
    const wasChanged = hasModifications(topic, getFormData());
    setChanged(wasChanged);
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
          Object.assign(topic, savedTopic);
          done(topic, isNew);
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

  return (
    <Fragment>
      <Grid
        ref={addTopicForm}
        component="form"
        container
        sx={{ flexGrow: '1' }}
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
              removeImage={removeImage}
            />
          </div>
        </Grid>
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
          {confirmDelete ? (
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
          <Button
            size="small"
            onClick={() => {
              done();
            }}
          >
            Cancel
          </Button>
          <Button size="small" variant="contained" type="submit">
            {isNewTopic() ? 'Post' : 'Change'}
          </Button>
        </Grid>
      </Grid>
    </Fragment>
  );
};

export default AddTopic;
