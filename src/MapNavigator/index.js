import axios from 'axios';
import React, { useRef, useState, useEffect, useMemo } from 'react';
import Overlay from 'react-bootstrap/Overlay';
import Popover from 'react-bootstrap/Popover';
import SearchBar from '../SearchBar';
import { jumpToLocation } from '../utils/map';
import { ReactComponent as SearchIcon } from '../common/images/icons/search-icon.svg';
import { API_URL } from '../constants';
import { validateLngLat } from '../utils/location';
import MouseMarkerPopup from '../MouseMarkerPopup';
import styles from './styles.module.scss';

const MapNavigator = ({map, showMarkerPopup = true}) => {
  const buttonRef = useRef(null);
  const wrapperRef = useRef(null);
  const [active, setActiveState] = useState(false);
  const [locations, setLocations] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [errors, setErrors] = useState([])

  const toggleActiveState = () => setActiveState(!active);

  // axios config
  const axiosGet = axios.create({
      baseURL: SEARCH_URL,
      headers: {
      'Content-Type': 'application/json',
      }
  });

  useEffect(() => {
    const handleKeyDown = (event) => {
      const { key } = event;
      if (key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        toggleActiveState();
      } 
    };

    // invoked when there is a click event outside the element
    const handleOutsideClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        toggleActiveState();
      }
    };

    // bind the eventlistener
    if (active) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    }
    // unbind the eventlistener during cleanup
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    }
  }, []);

  // listens to onChange events
  const handleSearchChange = (e) => {
    setQuery(e.target.value);
    // filter locations based on names
    // if (query.length > 1){
    //   let matches = [];
    //   matches = locations.filter((val) =>{
    //     return val.placeName.toLowerCase().includes(query.toLowerCase());
    //   });
    //   console.log('matches => ', matches);
    //   setSuggestions(matches);
    // }
  };

  // invoked when clear button is clicked
  const handleClearSearch = () => {
    setQuery('');
  };  

  // navigate to location on the map when Enter key is pressed
  const onKeyDown = (event) => {
    const { key } = event;
    if (key === 'Enter') {
      event.preventDefault();
      if (query && locations.length !== 0) {
        jumpToLocation(map, coords);
        setLocations([]);
        setQuery('');
      } else {
        setQuery('');
      }
    }
  }

  // make api call to google geocode api  
  const fetchLocation = async() => {
    const url = `${API_URL}coordinates?query=${query}`;
    const response = await axios.get(url);
    const {data: {data}} = response;
      if (data.placeName && data.coordinates) {
        setLocations(data);
      } else {
        setErrors(data);
        setLocations([]);
      }
    }

  // re-render component when query value changes
  useEffect(() => { fetchLocation(); }, [query]);

  // extract coordinates from api response
  const coords = locations.map(coord => {
    if (coord) {
      const coordinates = { 
        lng: coord.coordinates[1],
        lat: coord.coordinates[0]
      };
      // convert the returned objects to array
      const arrayOfCoords = Object.values(coordinates);
      return arrayOfCoords;
    } else {
      return null;
    }
  });

  // validate coordinates
  const validatedCoords = coords[0] && coords[1] && validateLngLat(coords[0], coords[1]);

  // extract error messages for display
  const errorMessages = errors.map((err, index) => (
    <p key={index}> {err.noResults} </p>
  ));
  
  // iterate on data array of objects and displays query suggestions
  const querySuggestions = locations.map((location, index) => (
    <li 
      className='suggestion'
      key={index}
      id={index}
      onClick={(e) => onQueryResultClick(e) }>
        {location.placeName}
    </li>
  ));
      
  // invoked when user clicks on a suggestion item
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

  // add a marker and popup to the map onQueryResults click
  const addMarker = (idx) => {
    const point = locations[idx];
    const coordinates = [point.coordinates[1], point.coordinates[0]];
    return showMarkerPopup && <MouseMarkerPopup coordinates={coordinates}/>;
  }

  // remove marker
  const removeMarker = () => {
    add && add.remove(map);
    setAdd(null);
  }
  document.addEventListener('click', removeMarker);

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
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
            <SearchBar
              className={styles.search}
              placeholder='Search Location ...'
              onChange={handleSearchChange}
              onClear={handleClearSearch}
              onKeyDown={onKeyDown}
              value={query}
            />
            <div style={{overflowY: 'scroll', height: '20vh'}}>
              { query && locations.length > 0 && <ul>{ querySuggestions}</ul> }
              { query && !locations.length && errorMessages }
            </div> 
            <MouseMarkerPopup />
          </Popover.Content>
        </Popover>
      </Overlay>           
    </div>
  )
}

export default MapNavigator;
