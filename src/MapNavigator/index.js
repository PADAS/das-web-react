import axios from 'axios';
import React, { useRef, useState, useEffect, useContext, useCallback } from 'react';
import Overlay from 'react-bootstrap/Overlay';
import Popover from 'react-bootstrap/Popover';
import SearchBar from '../SearchBar';
import { jumpToLocation } from '../utils/map';
import { ReactComponent as SearchIcon } from '../common/images/icons/search-icon.svg';
import { API_URL } from '../constants';
import { validateLngLat } from '../utils/location';
import mapboxgl from 'mapbox-gl';
import { MapContext } from '../App';
import styles from './styles.module.scss';

const MapNavigator = () => {
  const buttonRef = useRef(null);
  const wrapperRef = useRef(null);
  const [active, setActiveState] = useState(false);
  const [locations, setLocations] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [errors, setErrors] = useState([]);
  const [addMapMarker, setAddMapMarker] = useState(null);

  const toggleActiveState = useCallback(() => setActiveState(!active), [active]);

  // use context
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
    };
  }, [active, toggleActiveState]);

  // listens to onChange events
  const handleSearchChange = (e) => {
    setQuery(e.target.value);
    if (query && query.length > 1) {
      fetchLocation();
    }
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
        addMarker();
        setLocations([]);
        setQuery('');
      } else {
        setQuery('');
      }
    }
  };

  // make api call to google geocode api
  const fetchLocation = async() => {
    const url = `${API_URL}coordinates?query=${query}`;
    const response = await axios.get(url);
    const {data: {data}} = response;
    data.forEach(res => {
      if (res.placeName && res.coordinates) {
        setLocations(data);
      } else {
        setErrors(data);
        setLocations([]);
      }
    });
  };

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
  const validatedCoords = coords && validateLngLat(coords[0], coords[1])? [coords[0], coords[1]] : null;

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

  // add marker function
  const markers = [];
  const addMarker = (index) => {
    // on search result item click
    const point = locations[index];
    if (point) {
      const coordinates = [point.coordinates[1], point.coordinates[0]];    
      const popup = new mapboxgl.Popup({closeOnClick: true});
      const marker = new mapboxgl.Marker()
        .setLngLat(coordinates)
        .setPopup(popup.setHTML(
          `<h3>${point.placeName}</h3>${[point.coordinates[1]]}, ${[point.coordinates[0]]}`
        ));
      setAddMapMarker(marker);
      marker.addTo(map);
      marker.togglePopup();
    } else {
      // on keydown
      locations.forEach(point => {
        const popup = new mapboxgl.Popup({closeOnClick: true});
        const marker = new mapboxgl.Marker()
          .setLngLat([point.coordinates[1], point.coordinates[0]])
          .setPopup(popup.setHTML(
            `<h3>${point.placeName}</h3>${[point.coordinates[1]]}, ${[point.coordinates[0]]}`
          ));
        setAddMapMarker(marker);
        markers.push(marker);
        marker.addTo(map);
        marker.togglePopup();
      });
    }
  };

  // hide marker
  const hideMarker = () => {
    if (addMapMarker) {
      addMapMarker.remove(map);
      setAddMapMarker(null);
    }
    for (let marker of markers) {
      marker.remove(map);
    }
  };
  document.addEventListener('click', hideMarker);

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
          </Popover.Content>
        </Popover>
      </Overlay>        
    </div>
  );
};

export default MapNavigator;