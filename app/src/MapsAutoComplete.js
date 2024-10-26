import { useMemo, useRef, useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import parse from 'autosuggest-highlight/parse';
import { debounce } from '@mui/material/utils';

function loadScript(src, position, id) {
  if (!position) {
    return;
  }

  const script = document.createElement('script');
  script.setAttribute('async', '');
  script.setAttribute('id', id);
  script.src = src;
  position.appendChild(script);
}

const autocompleteService = { current: null };
const placesService = { current: null };

/*
interface MainTextMatchedSubstrings {
  offset: number;
  length: number;
}
interface StructuredFormatting {
  main_text: string;
  secondary_text: string;
  main_text_matched_substrings?: readonly MainTextMatchedSubstrings[];
}
interface PlaceType {
  description: string;
  structured_formatting: StructuredFormatting;
}
*/

export default function MapsAutoComplete({
  textFieldProps,
  onSelect,
  initValue,
  readOnly,
  googleMapsKey,
}) {
  const [value, setValue] = useState({
    description: initValue,
    structured_formatting: { main_text: initValue, secondary_text: '' },
  }); /* PlaceType */
  const [inputValue, setInputValue] = useState(initValue);
  const [options, setOptions] = useState([]); /** Placetype [] */
  const loaded = useRef(false);

  if (typeof window !== 'undefined' && !loaded.current) {
    if (!document.querySelector('#google-maps')) {
      loadScript(
        `https://maps.googleapis.com/maps/api/js?key=${googleMapsKey}&libraries=places&loading=async`,
        document.querySelector('head'),
        'google-maps',
      );
    }

    loaded.current = true;
  }

  const fetch = useMemo(
    () =>
      debounce(
        (
          request /*: { input: string },*/,
          callback /*: (results?: readonly PlaceType[]) => void,*/,
        ) => {
          autocompleteService.current.getPlacePredictions(request, callback);
        },
        400,
      ),
    [],
  );

  const fetchDetails = (placeId) => {
    const getComponent = (placeResult, type) =>
      placeResult?.address_components.find((v) =>
        v.types.some((t) => t === type),
      )?.short_name;

    placesService.current.getDetails(
      { placeId, fields: ['address_components'] },
      (placeResult) => {
        const zip = getComponent(placeResult, 'postal_code');
        const city = getComponent(placeResult, 'locality');
        const state = getComponent(placeResult, 'administrative_area_level_1');
        onSelect(city, state, zip);
      },
    );
  };

  useEffect(() => {
    let active = true;

    if (!autocompleteService.current && window.google) {
      autocompleteService.current =
        new window.google.maps.places.AutocompleteService();
    }
    if (!placesService.current && window.google) {
      placesService.current = new window.google.maps.places.PlacesService(
        document.createElement('div'),
      );
    }
    if (!autocompleteService.current || !placesService.current) {
      return undefined;
    }

    if (inputValue === '') {
      setOptions(value ? [value] : []);
      return undefined;
    }

    fetch({ input: inputValue }, (results) => {
      if (active) {
        let newOptions = [];

        if (value) {
          newOptions = [value];
        }

        if (results) {
          newOptions = [...newOptions, ...results];
        }

        setOptions(newOptions);
      }
    });

    return () => {
      active = false;
    };
  }, [value, inputValue, fetch]);

  return (
    <Autocomplete
      getOptionLabel={(option) =>
        typeof option === 'string' ? option : option.description
      }
      filterOptions={(x) => x}
      options={options}
      autoComplete
      freeSolo
      includeInputInList
      filterSelectedOptions
      value={value}
      readOnly={readOnly}
      noOptionsText="No locations"
      onChange={(event, newValue) => {
        setOptions(newValue ? [newValue, ...options] : options);
        if (!newValue) return;
        const {
          place_id: placeId,
          structured_formatting: { main_text: address },
        } = newValue;
        setValue(address);
        fetchDetails(placeId);
      }}
      isOptionEqualToValue={(option, value) => {
        return (
          value === option || value === option.structured_formatting?.main_text
        );
      }}
      onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue);
      }}
      renderInput={(params) => {
        // Hack to disable autocomplete since Chrome ignores 'off'
        params.inputProps.autoComplete = 'no-maps-autocomplete';
        return <TextField {...params} {...textFieldProps} />;
      }}
      renderOption={(props, option) => {
        const { key, ...optionProps } = props;
        const matches =
          option.structured_formatting.main_text_matched_substrings || [];

        const parts = parse(
          option.structured_formatting.main_text,
          matches.map((match) => [match.offset, match.offset + match.length]),
        );
        return (
          <li key={key} {...optionProps}>
            <Grid container sx={{ alignItems: 'center' }}>
              <Grid item sx={{ display: 'flex', width: 44 }}>
                <LocationOnIcon sx={{ color: 'text.secondary' }} />
              </Grid>
              <Grid
                item
                sx={{ width: 'calc(100% - 44px)', wordWrap: 'break-word' }}
              >
                {parts.map((part, index) => (
                  <Box
                    key={index}
                    component="span"
                    sx={{ fontWeight: part.highlight ? 'bold' : 'regular' }}
                  >
                    {part.text}
                  </Box>
                ))}
                <Typography variant="body2" color="text.secondary">
                  {option.structured_formatting.secondary_text}
                </Typography>
              </Grid>
            </Grid>
          </li>
        );
      }}
    />
  );
}
