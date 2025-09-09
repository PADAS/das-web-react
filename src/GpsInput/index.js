import React, { memo, useEffect, useId, useRef, useState } from 'react';
import debounce from 'lodash/debounce';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as CheckLightIcon } from '../common/images/icons/check-light.svg';

import {
  fetchForwardGeocoding,
  GPS_FORMAT_EXAMPLES,
  OUTSIDE_BBOX,
  parseCoordinates,
  stringifyCoordinates,
  validateLngLat,
} from '../utils/location';
import { selectCoordinatesRepresentation } from '../selectors/location';

import GpsFormatToggle from '../GpsFormatToggle';

import * as styles from './styles.module.scss';

const FETCH_PLACES_FROM_SEARCH_TEXT_DEBOUNCE_TIME = 200;

const GpsInput = ({
  gpsFormatToggleRef = null,
  id = null,
  inputRef = null,
  onChange,
  onPlaceSelected = null,
  ref,
  renderButton = null,
  showTextSearchOption = false,
  value = null,
  ...otherProps
}) => {
  const { t } = useTranslation('components', { keyPrefix: 'gpsInput' });

  const coordinatesRepresentation = useSelector(selectCoordinatesRepresentation);

  const innerInputRef = useRef();

  const descriptionId = useId();
  const errorMessageId = useId();
  const placesFromSearchTextListId = useId();

  const [activePlaceIndex, setActivePlaceIndex] = useState(-1);
  // The input value is handled locally and allows free text. When the input is
  // a valid set of coordinates, we update the parent through onChange.
  const [inputValue, setInputValue] = useState(() => value
    ? stringifyCoordinates(value, coordinatesRepresentation)
    : '');
  const [isInputValueValid, setIsInputValueValid] = useState(true);
  const [isTextSearchOptionChecked, setIsTextSearchOptionChecked] = useState(false);
  const [placesFromSearchText, setPlacesFromSearchText] = useState(null);
  const [selectedPlaceIndex, setSelectedPlaceIndex] = useState(null);

  // Debounced method to fetch forward geocoding from the search text.
  const fetchPlacesFromSearchText = useRef(debounce(async (searchText) => {
    const places = await fetchForwardGeocoding(searchText);

    // Reset the active and selected indexes when the places are updated.
    setActivePlaceIndex(-1);
    setSelectedPlaceIndex(null);
    setPlacesFromSearchText(places.map((place) => ({
      coordinates: place.coordinates,
      namePreferred: place.name_preferred,
      placeFormatted: place.place_formatted,
    })));
  }, FETCH_PLACES_FROM_SEARCH_TEXT_DEBOUNCE_TIME)).current;

  // The input is set in an error state if the text search option is not
  // checked and the input value not a valid set of coordinates or they are
  // outside of the coordinates representation BBOX.
  const isInputValid = isTextSearchOptionChecked || (isInputValueValid && inputValue !== OUTSIDE_BBOX);

  let description;
  let inputLabel = t('defaultLabel');
  let inputPlaceholder = t('defaultPlaceholder');
  if (isTextSearchOptionChecked) {
    inputLabel = t('textSearchLabel');
    inputPlaceholder = t('textSearchPlaceholder');

    if (!(placesFromSearchText?.length > 0)) {
      description = t('textSearchDescription');
    }
  } else if (coordinatesRepresentation) {
    inputLabel = t('coordinatesRepresentationLabel', {
      representation: coordinatesRepresentation?.name || coordinatesRepresentation,
    });

    if (coordinatesRepresentation?.name) {
      inputPlaceholder = coordinatesRepresentation.name;
    } else {
      description = t('coordinatesRepresentationDescription', {
        example: GPS_FORMAT_EXAMPLES[coordinatesRepresentation],
      });
      inputPlaceholder = t(`coordinatesRepresentationPlaceholder.${coordinatesRepresentation}`);
    }
  }

  const onInputBlur = () => {
    if (!isTextSearchOptionChecked) {
      // If the input is blurred and the text search option is not checked, set
      // its value to the value prop again since it should contain the last
      // valid value.
      setInputValue(value ? stringifyCoordinates(value, coordinatesRepresentation) : '');
      setIsInputValueValid(true);
    }
  };

  const onInputChange = async (event) => {
    setInputValue(event.target.value);

    if (isTextSearchOptionChecked) {
      // If the text search option is checked, use forward geocoding to fetch
      // the places from the search text.
      fetchPlacesFromSearchText(event.target.value);
    } else {
      // If the text search option is not checked, validate the input and
      // notify the parent about the change if it is valid.
      if (!event.target.value) {
        // Empty values are valid..
        setIsInputValueValid(true);
        onChange(null);
      } else {
        try {
          const lngLat = parseCoordinates(event.target.value, coordinatesRepresentation);

          const isNewInputValueValid = validateLngLat(lngLat.longitude, lngLat.latitude);
          setIsInputValueValid(isNewInputValueValid);
          if (isNewInputValueValid) {
            onChange(lngLat);
          }
        } catch (error) {
          setIsInputValueValid(false);
        }
      }
    }
  };

  const onPlaceOptionSelected = (event, index) => {
    // Make the place option active and selected, fill the input value with its
    // content, call onChange with the place coordinates and focus the input.
    const selectedPlace = placesFromSearchText[index];
    const fullPlaceName = selectedPlace.placeFormatted
      ? `${selectedPlace.namePreferred} - ${selectedPlace.placeFormatted}`
      : selectedPlace.namePreferred;

    setActivePlaceIndex(index);
    setSelectedPlaceIndex(index);
    setInputValue(fullPlaceName);

    onChange(selectedPlace.coordinates);
    onPlaceSelected?.(event, selectedPlace);

    innerInputRef.current.focus();
  };

  const onInputKeyDown = (event) => {
    if (isTextSearchOptionChecked && placesFromSearchText?.length > 0) {
      // If the text search option is checked and there are places from the
      // search text, add keyboard navigation to the input.
      switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();

        setActivePlaceIndex((activePlaceIndex) =>
          activePlaceIndex < placesFromSearchText.length - 1 ? activePlaceIndex + 1 : 0
        );

        break;

      case 'ArrowUp':
        event.preventDefault();

        setActivePlaceIndex((activePlaceIndex) =>
          activePlaceIndex > 0 ? activePlaceIndex - 1 : placesFromSearchText.length - 1
        );

        break;

      case 'Enter':
        if (activePlaceIndex >= 0) {
          event.preventDefault();

          onPlaceOptionSelected(event, activePlaceIndex);
        }

        break;

      default:
      }
    }
  };

  useEffect(() => {
    if (value) {
      if (isTextSearchOptionChecked) {
        // If the text search option is checked, set the input to the content
        // of the selected place or empty it if there isn't one.
        const selectedPlace = placesFromSearchText?.[selectedPlaceIndex];
        setInputValue(selectedPlace ? `${selectedPlace.namePreferred} - ${selectedPlace.placeFormatted}` : '');
      } else {
        // If the text search option is unchecked or the coordinates
        // representation changes, transform the input value to the new format.
        setInputValue(stringifyCoordinates(value, coordinatesRepresentation));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coordinatesRepresentation, isTextSearchOptionChecked]);

  return <div ref={ref} role="group" {...otherProps}>
    <GpsFormatToggle
      isTextSearchOptionChecked={isTextSearchOptionChecked}
      lngLat={value}
      onKeyDown={(event) => event.key === 'Enter' && innerInputRef.current.focus()}
      ref={gpsFormatToggleRef}
      setIsTextSearchOptionChecked={setIsTextSearchOptionChecked}
      showCoordinates={false}
      showTextSearchOption={showTextSearchOption}
    />

    <div className={styles.inputWrapper}>
      <input
        aria-activedescendant={isTextSearchOptionChecked && activePlaceIndex >= 0
          ? `place-from-search-text-option-${activePlaceIndex}`
          : undefined}
        aria-autocomplete={isTextSearchOptionChecked ? 'list' : undefined}
        aria-controls={isTextSearchOptionChecked ? placesFromSearchTextListId : undefined}
        aria-describedby={isInputValid && description ? descriptionId : undefined}
        aria-errormessage={!isInputValid ? errorMessageId : undefined}
        aria-expanded={isTextSearchOptionChecked ? placesFromSearchText?.length > 0 : undefined}
        aria-invalid={!isInputValid}
        aria-label={inputLabel}
        autoComplete="off"
        className={styles.input}
        id={id}
        onBlur={onInputBlur}
        onChange={onInputChange}
        onKeyDown={onInputKeyDown}
        placeholder={inputPlaceholder}
        ref={(element) => {
          if (inputRef) {
            inputRef.current = element;
          }
          innerInputRef.current = element;
        }}
        role={isTextSearchOptionChecked ? 'combobox' : undefined}
        title={inputLabel}
        type="search"
        // If the value is outside of the BBOX of the coordinates
        // representation, show N/A.
        value={inputValue === OUTSIDE_BBOX ? t('outsideBboxInputValue') : inputValue}
      />

      {renderButton?.()}
    </div>

    {isInputValid && description && <p className={styles.description} id={descriptionId}>
      {description}
    </p>}

    {!isInputValid && <p aria-live="assertive" className={`${styles.description} ${styles.error}`} id={errorMessageId}>
      {coordinatesRepresentation?.code && inputValue === OUTSIDE_BBOX
        ? t('outsideBboxErrorMessage', {
          crsName: coordinatesRepresentation.name,
          epsgCode: coordinatesRepresentation.code,
        })
        : t('invalidLocationErrorMessage')}
    </p>}

    {isTextSearchOptionChecked && placesFromSearchText?.length > 0 && <ul
      aria-label={t('placesFromSearchTextListLabel')}
      className={styles.placesFromSearchTextList}
      id={placesFromSearchTextListId}
      role="listbox"
    >
      {placesFromSearchText.map((place, index) => {
        const fullPlaceName = place.placeFormatted
          ? `${place.namePreferred} - ${place.placeFormatted}`
          : place.namePreferred;

        return <li
          aria-label={fullPlaceName}
          aria-selected={selectedPlaceIndex === index}
          className={`${styles.placeFromSearchTextOption} ${activePlaceIndex === index ? styles.active : ''}`}
          id={`place-from-search-text-option-${index}`}
          key={fullPlaceName}
          onClick={(event) => onPlaceOptionSelected(event, index)}
          role="option"
          title={fullPlaceName}
        >
          {selectedPlaceIndex === index && <CheckLightIcon
            aria-hidden
            className={styles.checkLightIcon}
            data-testid="gpsInput-placeFromSearchTextOption-checkLightIcon"
          />}

          <div className={styles.labelWrapper}>
            {place.namePreferred}

            {place.placeFormatted && <span className={styles.placeFormatted}>{place.placeFormatted}</span>}
          </div>
        </li>;
      })}
    </ul>}
  </div>;
};

export default memo(GpsInput);
