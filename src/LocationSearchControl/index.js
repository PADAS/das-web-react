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
  const debouncedCoordinates = useRef();
  const [active, setActiveState] = useState(false);
  const [locations, setLocations] = useState([]);
  const [coordinates, setCoordinates] = useState({});
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

  useEffect(() => {
    debouncedCoordinates.current = debounce(fetchCoordinates, 1000);
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
  };

  const fetchLocation = async(query) => {
    setIsLoading(true);
    try {
      const url = `${API_URL}search-by-address?input=${query}`;
      const response = await axios.get(url);
      const { data: { data } } = response;
      console.log('getPlaceNamesWithIds response => ', data);
      data.forEach(res => {
        if (res.place_name && res.place_id) {
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

  const fetchCoordinates = (place_id) => {
    // try {
    const url = `${API_URL}coordinates?place_id=${place_id}`;
    axios.get(url)
      .then(res => {
        const data = res.data.coordinates;
        setCoordinates(data);
        console.log('getCooordinates response => ', data);
      })
      .catch(e => { console.log(e); } );
    //   console.log('getCooordinates response => ', data);
    //   if (data.coordinates) {
    //     setCoordinates(data);
    //   }
    // } catch (error) {
    //   console.log(error);
    // }
  };

  const coords = Object.values({ lng: coordinates.lng, lat: coordinates.lat });
  console.log('JumpToLocation => ', coords);
  const validatedCoords = coords[0] && coords[1] && validateLngLat(coords[1], coords[0]);

  const errorMessages = errors.map((err, index) => (
    <p className={styles.zero_results} key={index}> {err.no_results} </p>
  ));

  const querySuggestions = locations.map((location, index) => (
    <li
      className={styles.suggestion}
      key={index}
      id={index}
      onClick={(e) => onQueryResultClick(e) }>
      {location.place_name}
    </li>
  ));

  const onQueryResultClick = (e) => {
    e.preventDefault();
    if (query) {
      const resultIndex = parseInt(e.target.id);
      const placeId = locations[resultIndex];
      fetchCoordinates(placeId.place_id);
      jumpToLocation(map, coords);
      setSelectedLocation(locations[resultIndex]);
      addMarker();
      setLocations([]);
      setQuery('');
    };
  };

  const addMarker = () => {
    validatedCoords && showPopup('dropped-marker', { location: coordinates, coords } );
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