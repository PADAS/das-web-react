import React, { Fragment, memo, useCallback, useState, useEffect } from 'react';


const MapRuler = (props) => {
  const [points, setPoints] = useState([]);
  const [drawing, setDrawingState] = useState(false);
  const [showLayer, setLayerState] = useState(false);

  const [pointPopupCoords, setPointPopupCoords] = useState(null);
  const [cursorPopupCoords, setCursorPopupCoords] = useState(null);

  const addPoint = useCallback((point) => {
    setPoints([...points, point]);
  }, [points]);

  const onButtonClick = useCallback(() => {
    setLayerState(!showLayer);
  }, [showLayer]);

  const onLayerClick = useCallback((point) => {
    addPoint(point);
  }, [addPoint]);

  const onLayerDoubleClick = useCallback(() => {
    setDrawingState(false);
  }, []);

  const onPointClick = useCallback((point) => {
    setPointPopupCoords(point);
  }, []);

  const handleEscape = useCallback(() => {
    if (drawing) {
      setDrawingState(false);
    } else {
      setLayerState(false);
    }
  }, [drawing]);

  useEffect(() =>{
    setDrawingState(showLayer);
    setPoints([]);
  }, [showLayer]);
  
  return <Fragment>
    {/* Control */}
    {/* LineLayer */}
    {/* CursorPopup */}
    {/* Point Popup */}
  </Fragment>;
};

export default memo(MapRuler);