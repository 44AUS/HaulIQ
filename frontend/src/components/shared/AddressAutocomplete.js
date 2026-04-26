import { useRef, useState, useEffect } from 'react';
import { Autocomplete, useJsApiLoader } from '@react-google-maps/api';

const LIBRARIES = ['places'];

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  backgroundColor: 'var(--ion-input-background, rgba(0,0,0,0.04))',
  border: '1px solid var(--ion-border-color)',
  borderRadius: 6,
  color: 'var(--ion-text-color)',
  fontSize: '0.875rem',
  padding: '9px 12px',
  outline: 'none',
  fontFamily: 'inherit',
};

export default function AddressAutocomplete({ value, onChange, placeholder, label, required }) {
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

  const inputEl = (
    <input
      style={inputStyle}
      placeholder={placeholder || label}
      required={required}
      value={inputValue}
      onChange={handleChange}
      autoComplete="off"
    />
  );

  if (!isLoaded) return inputEl;

  return (
    <Autocomplete
      onLoad={onLoad}
      onPlaceChanged={onPlaceChanged}
      options={{ componentRestrictions: { country: 'us' } }}
    >
      {inputEl}
    </Autocomplete>
  );
}
