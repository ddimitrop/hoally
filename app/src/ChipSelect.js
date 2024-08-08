import { useState } from 'react';
import Box from '@mui/material/Box';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Chip from '@mui/material/Chip';

export default function ChipSelect({ options, id, label, value, onChange }) {
  const [newValue, setNewValue] = useState(value || []);
  const [open, setOpen] = useState(false);

  const handleClose = () => {
    setOpen(false);
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const handleChange = (event) => {
    const {
      target: { value },
    } = event;
    // On autofill we get a stringified value.
    const changedValue = typeof value === 'string' ? value.split(',') : value;
    setNewValue(changedValue);
    onChange(changedValue);
    handleClose();
  };

  function getOptionSx(option) {
    return {
      fontWeight: newValue.indexOf(option) === -1 ? 'normal' : 'medium',
    };
  }

  return (
    <FormControl fullWidth>
      <InputLabel id={`${id}-label`}>{label}</InputLabel>
      <Select
        labelId={`${id}-label`}
        id={id}
        multiple
        value={newValue}
        onChange={handleChange}
        open={open}
        onClose={handleClose}
        onOpen={handleOpen}
        input={<OutlinedInput fullWidth label={label} />}
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selected.map((value) => (
              <Chip key={value} label={value} />
            ))}
          </Box>
        )}
      >
        {options.map((option) => (
          <MenuItem key={option} value={option} sx={getOptionSx(option)}>
            {option}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
