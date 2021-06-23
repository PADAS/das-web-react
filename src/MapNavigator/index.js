import React, { memo, useRef, useState, useEffect, useCallback } from 'react';
import { connect } from 'react-redux';
import Overlay from 'react-bootstrap/Overlay';
import Popover from 'react-bootstrap/Popover';
import SearchBar from '../SearchBar';
import { searchLocation, fetchSearchResults } from '../ducks/location-finder';
import { ReactComponent as SearchIcon } from '../common/images/icons/search-icon.svg';
import styles from './styles.module.scss';

const MapNavigator = (props) => {
    const { locationFinder, searchLocation } = props;
    const { search, results } = locationFinder;
    const buttonRef = useRef(null);
    const wrapperRef = useRef(null);
    const [active, setActiveState] = useState(false);

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
    }, [active]);

    // listens to change events
    const handleSearchChange = useCallback(({target: {value}}) => {
        // console.log(value);
        searchLocation({search: !!value ? value.toLowerCase() : null,});
    }, []);

    // invoked when clear button is clicked
    const handleClearSearch = () => {
        searchLocation({search: ''});
    };

    const onKeyDown = (event) => {
        const { key } = event;
        if (key === 'Enter') {
          event.preventDefault();
          fetchSearchResults();
        }
      };

    // TODO: search with auto-complete
    // useEffect(() => {
    //     fetchSearchResults();
    // },[search]);

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
                        value={search}
                        onKeyDown={onKeyDown}
                        />
                    </Popover.Content>
                </Popover>
            </Overlay>
        </div>
    )
}

const mapStateToProps = ({data: {locationFinder}}) => ({ locationFinder });

export default connect(mapStateToProps, {searchLocation, fetchSearchResults})(memo(MapNavigator));