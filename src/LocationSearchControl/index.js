import axios from 'axios';
import React, { useRef, useState, useEffect, useContext, useCallback, memo, useMemo } from 'react';
import Overlay from 'react-bootstrap/Overlay';
import { connect } from 'react-redux';
import debounce from 'lodash/debounce';
import Popover from 'react-bootstrap/Popover';
import SearchBar from '../SearchBar';
import { jumpToLocation } from '../utils/map';
import { ReactComponent as SearchIcon } from '../common/images/icons/search-icon.svg';
import { API_URL } from '../constants';
import { validateLngLat } from '../utils/location';
import { MapContext } from '../App';
import { showPopup } from '../ducks/popup';
import styles from './styles.module.scss';

const LocationSearch = (props) => {
  const { showPopup } = props;
  const buttonRef = useRef(null);
  const wrapperRef = useRef(null);
  const debouncedApiCall = useRef();
  const [active, setActiveState] = useState(false);
  const [locations, setLocations] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null); /* eslint-disable-line no-unused-vars */
  const [errors, setErrors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const toggleActiveState = useCallback(() => setActiveState(!active), [active]);

  const map = useContext(MapContext);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const { key } = event;
      if (key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        toggleActiveState();
      }
    };

    const handleOutsideClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        toggleActiveState();
      }
    };

    if (active) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [active, toggleActiveState]);

  useEffect(() => {
    debouncedApiCall.current = debounce(fetchLocation, 500);
  }, []);

  const handleSearchChange = (e) => {
    setQuery(e.target.value);
  };

  useEffect(() => {
    if (query.length > 1) {
      debouncedApiCall.current(query);
    }
  }, [query]);

  const handleClearSearch = () => {
    setQuery('');
    setLocations([]);
    setErrors([]);
  };

  const onKeyDown = (event) => {
    const { key } = event;
    if (key === 'Enter') {
      event.preventDefault();
      if (query && locations.length !== 0) {
        jumpToLocation(map, coords);
        addMarker();
        setLocations([]);
        setQuery('');
      } else {
        setQuery('');
        setErrors([]);
        setLocations([]);
      }
    }
    if (key === 'Backspace' || key === 'Delete') {
      event.preventDefault();
      if (query) {
        setQuery('');
        setLocations([]);
        setErrors([]);
      }
    }
  };

  const fetchLocation = async(query) => {
    setIsLoading(true);
    try {
      const url = `${API_URL}coordinates?query=${query}`;
      const response = await axios.get(url);
      const { data: { data } } = response;
      data.forEach(res => {
        if (res.placeName && res.coordinates) {
          setLocations(data);
          setErrors([]);
          setIsLoading(false);
        } else {
          setErrors(data);
          setLocations([]);
          setIsLoading(false);
        }
      });
    } catch (error) {
      if (error.response) {
        console.log(error.response.data);
      } else if (error.request) {
        console.log(error.request);
      } else {
        console.log(error.message);
      }
    };
  };

  const coords = useMemo(() => locations.map(coord => {
    if (coord) {
      const coordinates = { lng: coord.coordinates.lng, lat: coord.coordinates.lat };
      const arrayOfCoords = Object.values(coordinates);
      return arrayOfCoords;
    } else {
      return null;
    }
  }), [locations]);

  const validatedCoords = locations.every(coord =>
    validateLngLat(coord.coordinates.lng, coord.coordinates.lat)
  );

  const errorMessages = errors.map((err, index) => (
    <p className={styles.zero_results} key={index}> {err.noResults} </p>
  ));

  const querySuggestions = locations.map((location, index) => (
    <li
      className={styles.suggestion}
      key={index}
      id={index}
      onClick={(e) => onQueryResultClick(e) }>
      {location.placeName}
    </li>
  ));

  const onQueryResultClick = (e) => {
    e.preventDefault();
    if (query) {
      jumpToLocation(map, coords);
      const resultIndex = parseInt(e.target.id);
      setSelectedLocation(locations[resultIndex]);
      addMarker(resultIndex);
      setLocations([]);
      setQuery('');
    };
  };

  const addMarker = (index) => {
    if (index) {
      const point = locations[index];
      const coordinates = [ point.coordinates.lng, point.coordinates.lat ];
      validatedCoords && showPopup('dropped-marker', { location: point.coordinates, coordinates } );
    } else {
      locations.forEach(points => {
        const coordinates = [ points.coordinates.lng, points.coordinates.lat ];
        validatedCoords && showPopup('dropped-marker', { location: points.coordinates, coordinates } );
      });
    }
  };

  return <div className={styles.wrapper} ref={wrapperRef}>
    <button type='button'
      className={styles.button}
      onClick={toggleActiveState}
      ref={buttonRef}>
      <SearchIcon className={styles.searchButton}/>
    </button>
    <Overlay show={active} target={buttonRef.current}
      container={wrapperRef.current} placement='right'>
      <Popover placement='right'>
        <Popover.Content>
          <div className={styles.popover}>
            <SearchBar
              className={styles.search}
              placeholder='Search Location ...'
              onChange={handleSearchChange}
              onClear={handleClearSearch}
              onKeyDown={onKeyDown}
              value={query}
            />
            <div className={styles.results}>
              { query && !locations.length && errorMessages }
              { query
                && !locations.length
                && !errors.length
                && isLoading && <p className={styles.loading_indicator}> Fetching ... </p>
              }
              { query && locations.length > 0 && <ul>{ querySuggestions}</ul> }
            </div>
          </div>
        </Popover.Content>
      </Popover>
    </Overlay>
  </div>;
};

export default connect(null, { showPopup })(memo(LocationSearch));