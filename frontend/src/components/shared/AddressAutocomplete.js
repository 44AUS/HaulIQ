import { useRef, useState, useEffect } from 'react';
import { Autocomplete, useJsApiLoader } from '@react-google-maps/api';
import TextField from '@mui/material/TextField';

const LIBRARIES = ['places'];

/**
 * Google Places full-address autocomplete.
 *
 * Props:
 *   value        – controlled display value (string)
 *   onChange     – called with { address, cityState, lat, lng } on place selection
 *                  or with { address: string } when user types freely
 *   placeholder  – input placeholder
 *   label        – MUI TextField label
 *   required     – boolean
 *   size         – MUI TextField size (default "small")
 */
export default function AddressAutocomplete({ value, onChange, placeholder, label, required, size = 'small' }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_KEY || '',
    libraries: LIBRARIES,
  });

  const autocompleteRef = useRef(null);
  const [inputValue, setInputValue] = useState(value || '');

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  const onLoad = (ac) => { autocompleteRef.current = ac; };

  const onPlaceChanged = () => {
    const ac = autocompleteRef.current;
    if (!ac) return;
    const place = ac.getPlace();
    if (!place.geometry) return;

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    const address = place.formatted_address || place.name || '';

    // Extract city and state from address_components
    let city = '';
    let state = '';
    for (const comp of place.address_components || []) {
      if (comp.types.includes('locality')) city = comp.long_name;
      else if (comp.types.includes('sublocality_level_1') && !city) city = comp.long_name;
      if (comp.types.includes('administrative_area_level_1')) state = comp.short_name;
    }
    const cityState = city && state ? `${city}, ${state}` : city || state || address;

    setInputValue(address);
    onChange({ address, cityState, lat, lng });
  };

  const handleChange = (e) => {
    setInputValue(e.target.value);
    onChange({ address: e.target.value });
  };

  if (!isLoaded) {
    return (
      <TextField
        fullWidth
        size={size}
        label={label}
        placeholder={placeholder}
        required={required}
        value={inputValue}
        onChange={handleChange}
      />
    );
  }

  return (
    <Autocomplete
      onLoad={onLoad}
      onPlaceChanged={onPlaceChanged}
      options={{ componentRestrictions: { country: 'us' } }}
    >
      <TextField
        fullWidth
        size={size}
        label={label}
        placeholder={placeholder}
        required={required}
        value={inputValue}
        onChange={handleChange}
        autoComplete="off"
      />
    </Autocomplete>
  );
}
