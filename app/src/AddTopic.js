import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import ChipSelect from './ChipSelect.js';
import { Global } from './Global.js';
import { useRef, useContext, useState, Fragment } from 'react';
import { hasModifications } from './state-utils';
import { useParams } from 'react-router-dom';
import { postData } from './json-utils.js';
import ClearIcon from '@mui/icons-material/Clear';

const AddTopic = ({ topic, confirmDelete, member, done, setChanged }) => {
  const global = useContext(Global);
  const addTopicForm = useRef(null);
  const subject = useRef(null);
  const description = useRef(null);
  const { communityId } = useParams();
  const [type, setType] = useState(topic.type);
  let [tags, setTags] = useState(topic.tags || []);
  let [propositions, setPropositions] = useState(
    topic.propositions || [{ description: '' }],
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

  const getFormData = () => {
    return {
      subject: subject.current.value,
      description: description.current.value,
      type,
      tags,
      propositions,
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
    const newPropositions = [...propositions, { description: '' }];
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
      .then(({ topic: savedTopic }) => {
        Object.assign(topic, savedTopic);
        done(topic, isNew);
      })
      .catch((e) => {
        global.setAppError(e.message);
      });
  };

  const hasAddButton = (i) =>
    i === propositions.length - 1 && MAX_PROPOSITIONS > propositions.length;

  return (
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
        <TextField
          margin="dense"
          id="description"
          name="description"
          label="Details"
          defaultValue={topic.description}
          fullWidth
          multiline
          maxRows={4}
          autoComplete="no-auto-complete"
          variant="standard"
          size="small"
          inputRef={description}
          onChange={checkWasChanged}
        />
      </Grid>
      {type === 'proposition'
        ? propositions.map((proposition, i) => (
            <Fragment key={i}>
              <Grid
                item
                md={hasAddButton(i) ? 9 : 11}
                xs={hasAddButton(i) ? 7 : 11}
              >
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
              </Grid>
              <Grid
                item
                md={hasAddButton(i) ? 3 : 1}
                xs={hasAddButton(i) ? 5 : 1}
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
  );
};

export default AddTopic;
