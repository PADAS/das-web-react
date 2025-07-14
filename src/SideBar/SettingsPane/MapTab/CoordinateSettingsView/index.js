import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { ReactComponent as ArrowLeftIcon } from '../../../../common/images/icons/arrow-left.svg';

import { getProj4CompatibleCRS, GPS_FORMATS } from '../../../../utils/location';
import {
  setSelectedCoordinateReferenceSystems,
  setStoredCoordinateReferenceSystems,
} from '../../../../ducks/coordinate-reference-systems';

const MAX_SELECTED_GPS_FORMATS = 5;
const MAX_FILTERED_PROJECTION_RESULTS = 10;

const GpsFormatOption = ({ identifier, isDeletable, label }) => {
  const dispatch = useDispatch();

  const selectedCRS = useSelector((state) => state.view.coordinateReferenceSystems.selectedSystems);
  const storedCRS = useSelector((state) => state.view.coordinateReferenceSystems.storedSystems);

  const isChecked = selectedCRS.includes(identifier);
  const shouldDisable = identifier === GPS_FORMATS.DEG
    || (!isChecked && selectedCRS.length === MAX_SELECTED_GPS_FORMATS);

  const onCheckboxChange = () => {
    if (isChecked) {
      dispatch(
        setSelectedCoordinateReferenceSystems(
          selectedCRS.filter((selectedCRSIdentifier) => selectedCRSIdentifier !== identifier)
        )
      );
    } else {
      dispatch(setSelectedCoordinateReferenceSystems([...selectedCRS, identifier]));
    }
  };

  const onDelete = () => {
    if (isChecked) {
      dispatch(
        setSelectedCoordinateReferenceSystems(
          selectedCRS.filter((selectedGpsFormat) => selectedGpsFormat !== identifier)
        )
      );
    }

    dispatch(
      setStoredCoordinateReferenceSystems(
        storedCRS.filter(
          (storedCRS) => storedCRS.code !== identifier
        )
      )
    );
  };

  // TODO (CRS): I18n, proper semantics and a11y.
  return <div>
    <input
      checked={isChecked}
      disabled={shouldDisable}
      id={`stored-gps-format-${identifier}`}
      onChange={onCheckboxChange}
      type="checkbox"
    />

    {/* TODO (CRS): I18n of the defaults by key. */}
    <label htmlFor={`stored-gps-format-${identifier}`}>{label}</label>

    {isDeletable && <button onClick={onDelete}
    >
      Delete
    </button>}
  </div>;
};

const CoordinateSettingsView = ({ onShowMainMapSettingsView }) => {
  const dispatch = useDispatch();

  const storedCRS = useSelector((state) => state.view.coordinateReferenceSystems.storedSystems);

  const [supportedCRS, setSupportedCRS] = useState(null);
  const [searchText, setSearchText] = useState('');

  const filteredCRS = useMemo(() => {
    if (supportedCRS) {
      const lowerCaseSearchText = searchText.toLowerCase();

      // TODO (CRS): Refactor and bounce?.
      const filteredCRS = [];
      for (const crs of supportedCRS) {
        const isCoordinateReferenceSystemStored = storedCRS.find(
          (storedCoordinateReferfenceSystem) =>
            storedCoordinateReferfenceSystem.code === crs.code
        );
        if (!isCoordinateReferenceSystemStored) {
          const doeCoordianteReferenceSystemMatchSearchText =
            crs.area?.toLowerCase().includes(lowerCaseSearchText)
              || crs.code.toString().includes(lowerCaseSearchText)
              || crs.name.toLowerCase().includes(lowerCaseSearchText);
          if (doeCoordianteReferenceSystemMatchSearchText) {
            filteredCRS.push(crs);

            if (filteredCRS.length === MAX_FILTERED_PROJECTION_RESULTS) {
              break;
            }
          }
        }
      }
      return filteredCRS;
    }
    return [];
  }, [searchText, storedCRS, supportedCRS]);

  const gpsFormatOptions = [
    // The default GPS formats are always listed.
    ...Object.values(GPS_FORMATS).map((gpsFormat) => ({
      isDefault: true,
      key: gpsFormat,
    })),
    ...storedCRS,
  ];

  useEffect(() => {
    // Variable to track if the component is still mounted in order to avoid
    // setting the state if it is not.
    let isMounted = true;

    const fetchCRS = async () => {
      const proj4CompatibleCRS = await getProj4CompatibleCRS();
      if (isMounted) {
        setSupportedCRS(proj4CompatibleCRS);
      }
    };

    fetchCRS();

    return () => {
      isMounted = false;
    };
  }, []);

  // TODO (CRS): I18n, proper semantics and a11y.
  return <>
    <div>
      <button onClick={() => onShowMainMapSettingsView()}>
        <ArrowLeftIcon />
      </button>

      Coordinates
    </div>

    <p>
      Select up to 4 coordinate units to display across the site. Options will be displayed alphabetically by default. Click and drag to set a custom order.
    </p>

    {gpsFormatOptions.map((gpsFormatOption) => <GpsFormatOption
      identifier={gpsFormatOption.isDefault ? gpsFormatOption.key : gpsFormatOption.code}
      isDeletable={!gpsFormatOption.isDefault}
      key={gpsFormatOption.isDefault ? gpsFormatOption.key : gpsFormatOption.code}
      label={gpsFormatOption.isDefault ? gpsFormatOption.key : gpsFormatOption.name}
    />)}

    <p>
      Search additional coordinate reference systems
    </p>

    {/* TODO (CRS): Bring the new accessible search bar from the ERA-11695 PR */}
    <input onChange={(event) => setSearchText(event.target.value)} type="search" value={searchText} />

    <br />

    {/* TODO (CRS): Show loader while fetching */}
    <ul>
      {filteredCRS.map((filteredCRS) => <li key={filteredCRS.code}>
        {filteredCRS.code} - {filteredCRS.name} - {filteredCRS.area}

        <button
          onClick={() => dispatch(setStoredCoordinateReferenceSystems([...storedCRS, filteredCRS]))}
        >
          Add
        </button>
      </li>)}
    </ul>
  </>;
};

export default CoordinateSettingsView;
