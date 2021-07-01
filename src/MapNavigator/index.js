import axios from 'axios';
import React, { memo, useRef, useState, useEffect, useCallback } from 'react';
import { connect } from 'react-redux';
import Overlay from 'react-bootstrap/Overlay';
import Popover from 'react-bootstrap/Popover';
import SearchBar from '../SearchBar';
import { searchLocation, fetchLocations } from '../ducks/location-finder';
import { jumpToLocation } from '../utils/map'
import { REACT_APP_MAPBOX_TOKEN } from '../constants';
import { ReactComponent as SearchIcon } from '../common/images/icons/search-icon.svg';
import styles from './styles.module.scss';

const SEARCH_URL='https://api.mapbox.com/geocoding/v5/mapbox.places/'

const MapNavigator = (props) => {
    const { map } = props;
    // const { search, results } = locationFinder;
    const buttonRef = useRef(null);
    const wrapperRef = useRef(null);
    const [active, setActiveState] = useState(false);
    const [locations, setLocations] = useState([]);
    const [query, setQuery] = useState('');
    const [selectedLocation, setSelectedLocation] = useState(null);

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
    }, [active]);

    const onKeyDown = (event) => {
        const { key } = event;
        if (key === 'Enter') {
            event.preventDefault();
            onQueryResultClick()
        }
    }

    // make api call to mapbox api
    const fetchLocation = async() => {
        const url = `${query}.json?access_token=${REACT_APP_MAPBOX_TOKEN}`
        const data = await axiosGet.request({
            method: 'get',
            url: url
        })
        const {data: { features }} = data;
        setLocations(features);
        const obj = features.map((location) => {
            const obj2 = {
                coords: location.geometry.coordinates,
                placename: location.place_name
            }
            return obj2
        })
        console.log(obj)
        return obj;
    }

    // extract coordinates from api response
    const coordinates = () => {
        locations.map(coord => {
            const obj = {
                lng: coord.geometry.coordinates[0],
                lat: coord.geometry.coordinates[1]
            }
            console.log(obj)
            return obj
        })
    }

    const coords = coordinates();

    // listens to change events; auto-completes the search query
    const handleSearchChange = (e) => {
        setQuery(e.target.value);
        if (query && query.length > 0) {
            fetchLocation();
        }
    };

    // invoked when clear button is clicked
    const handleClearSearch = () => {
        setQuery('');
    };  
    
    // loop thru features array of objects and displays query suggestions
    const querySuggestions = React.Children.toArray(
        locations.map((location) => (
            <li className='suggestion' id={location.id}>
                {location.place_name}
            </li>
        ))
    )
        
    // invoked when user clicks on a suggestion item
    const onQueryResultClick = (e) => {
        jumpToLocation(map, coords);
        const searchResult = e.target.id;
        setSelectedLocation(locations[searchResult])
        setLocations([])
    }

    return (
        <div className={styles.wrapper} ref={wrapperRef}>
            <button type='button'
            className={styles.button}
            onClick={toggleActiveState} 
            ref={buttonRef}>
                <SearchIcon className={styles.searchIcon}/>
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
                        <div className='query-suggestions'>
                            { query.length > 1 &&
                            (<ul onClick={onQueryResultClick} >{querySuggestions}</ul>) }
                        </div> 
                    </Popover.Content>
                </Popover>
            </Overlay>           
        </div>
    )
}

const mapStateToProps = ({data: {locationFinder}}) => ({ locationFinder });

export default connect(mapStateToProps, {searchLocation, fetchLocations})(memo(MapNavigator));