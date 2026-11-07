import { useCallback, useContext, useEffect, useRef } from 'react';
import { useDispatch, useStore } from 'react-redux';

import { HOST_TOOL_ERROR_CODES } from '../HostToolError';
import { MapContext } from '../../MapContext';
import runHostTool from '../';
import useJumpToLocation from '../../hooks/useJumpToLocation';
import useNavigate from '../../hooks/useNavigate';

// Resolves with what the caller hands back to Atlas, never rejects. A call
// reads the map and store as they are when it runs.
const useRunHostAction = () => {
  const dispatch = useDispatch();
  const jumpToLocation = useJumpToLocation();
  const map = useContext(MapContext);
  const navigate = useNavigate();
  const store = useStore();

  const contextRef = useRef(null);

  useEffect(() => {
    contextRef.current = { dispatch, getState: store.getState, jumpToLocation, map, navigate };
  });

  return useCallback(async (name, args) => {
    try {
      return { ok: true, result: await runHostTool(name, args ?? {}, contextRef.current) };
    } catch (error) {
      console.warn('error running a host action', name, error);

      return { error: { code: error.code ?? HOST_TOOL_ERROR_CODES.FAILED, message: error.message }, ok: false };
    }
  }, []);
};

export default useRunHostAction;
