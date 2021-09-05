import axios from 'axios';
import React, { useRef, useState, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import Overlay from 'react-bootstrap/Overlay';
import Popover from 'react-bootstrap/Popover';
import SearchBar from '../SearchBar';
import { jumpToLocation } from '../utils/map';
import { ReactComponent as SearchIcon } from '../common/images/icons/search-icon.svg';
import { API_URL } from '../constants';
import styles from './styles.module.scss';

const MapNavigator = (props) => {
  const { map } = props;
  const buttonRef = useRef(null);
  const wrapperRef = useRef(null);
  const [active, setActiveState] = useState(false);
  const [locations, setLocations] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [add, setAdd] = useState(null);
  const [errors, setErrors] = useState([]);

  const toggleActiveState = () => setActiveState(!active);

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

  // navigate to location on the map on when Enter key is pressed
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
      const url = `${API_URL}coordinates?address=${query}`;
      const response = await axios.get(url);
      const {data: {data}} = response;
      if (!data[0].placeName || !data[0].coodinates) {
        setErrors(data);
        const error = errors.map(err => {
          const errorObject = {
            zeroResult: err.noResults
          }
          return errorObject;
        });
        return error;
      } else {
        setLocations(data);
        const location = locations.map(location => {
          const locationObject = {
            coordinates: location.coordinates,
            placename: location.placeName
          }
          return locationObject;
        });
        console.log(location);
        return location;
      }
  }
  
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

  // extract error messages for display
  const errorMessages = errors.map((err, index) => (
    <p key={index}> {err.noResults} </p>
  ));

  // listens to change events; auto-completes the search query
  const handleSearchChange = (e) => {
    setQuery(e.target.value);
    if (query && query.length > 1){
      fetchLocation();
    }
  };

  // invoked when clear button is clicked
  const handleClearSearch = () => {
    setQuery('');
  };  
  
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

  // add a marker to the map by 
  // clicking on search result item
  const addMarker = (idx) => {
    const point = locations[idx];
    const marker = new mapboxgl.Marker().setLngLat(
      [
        point.coordinates[1],
        point.coordinates[0]
      ]
    );
    setAdd(marker);
    marker.addTo(map);
  }

  // remove single marker
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
              { query && locations.length == 0 && errorMessages }
            </div> 
          </Popover.Content>
        </Popover>
      </Overlay>           
    </div>
  )
}

export default MapNavigator;
