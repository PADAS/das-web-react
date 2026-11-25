import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';

import { toolErrorResult } from '../utils/atlas-tools/results';
import useAtlasAppActions from '../hooks/useAtlasAppActions';
import useAtlasCameraHistory from '../hooks/useAtlasCameraHistory';
import { validateToolCall } from '../utils/atlas-tools/validate';
import useWebMcpTools from './useWebMcpTools';

// Longer than the slowest tool's own waits, about 10 seconds in all.
export const ATLAS_STEP_TIMEOUT_MS = 15_000;
export const JSON_RPC_ERROR_CODES = { INVALID_PARAMS: -32602, METHOD_NOT_FOUND: -32601 };

const SUPERSEDED_TEXT = 'Skipped, superseded by a newer reply.';
const TIMEOUT_TEXT = `Moved on, the call did not finish within ${ATLAS_STEP_TIMEOUT_MS / 1000} s.`;

const AtlasToolsContext = createContext(null);

/* Runs the tools Atlas (and, with WebMCP, any browser agent) calls, one at a
   time in the order they arrive, since tools await routes and data. A call
   with a batch (one Atlas reply) makes its batch the current one, and the
   waiting calls of an older batch are dropped; a call without one never is. */
const AtlasToolsProvider = ({ children }) => {
  const cameraHistory = useAtlasCameraHistory();
  const runAtlasAppAction = useAtlasAppActions(cameraHistory);

  const runAtlasAppActionRef = useRef(runAtlasAppAction);
  useEffect(() => {
    runAtlasAppActionRef.current = runAtlasAppAction;
  });

  const currentBatchRef = useRef(null);
  const isRunningRef = useRef(false);
  const waitingCallsRef = useRef([]);

  const runWithTimeout = useCallback(async ({ name, params }) => {
    let timeoutId;
    const timeout = new Promise((resolve) => {
      timeoutId = setTimeout(() => {
        console.warn(`[atlas-tools] ${name}: moving on after ${ATLAS_STEP_TIMEOUT_MS} ms without finishing`);

        resolve(toolErrorResult(TIMEOUT_TEXT));
      }, ATLAS_STEP_TIMEOUT_MS);
    });

    const run = (async () => {
      try {
        return await runAtlasAppActionRef.current({ action: name, ...params });
      } catch (error) {
        console.warn(`[atlas-tools] ${name}: failed`, error);

        return toolErrorResult(`Failed: ${error?.message ?? String(error)}`);
      }
    })();

    try {
      return await Promise.race([run, timeout]);
    } finally {
      clearTimeout(timeoutId);
    }
  }, []);

  const runWaitingCalls = useCallback(async () => {
    if (isRunningRef.current) return;

    isRunningRef.current = true;
    while (waitingCallsRef.current.length) {
      const call = waitingCallsRef.current.shift();

      call.resolve(await runWithTimeout(call));
    }
    isRunningRef.current = false;
  }, [runWithTimeout]);

  // Rejects an invalid call with a JSON-RPC error, and otherwise resolves to
  // the MCP result of the call.
  const callTool = useCallback((name, args, { batch } = {}) => {
    const validation = validateToolCall(name, args);
    if (!validation.ok) {
      return Promise.reject({ code: JSON_RPC_ERROR_CODES.INVALID_PARAMS, message: validation.message });
    }

    if (batch !== undefined && batch !== currentBatchRef.current) {
      currentBatchRef.current = batch;

      waitingCallsRef.current = waitingCallsRef.current.filter((call) => {
        if (call.batch === undefined || call.batch === batch) return true;

        console.warn(`[atlas-tools] ${call.name}: skipped, a newer Atlas reply arrived`);
        call.resolve(toolErrorResult(SUPERSEDED_TEXT));

        return false;
      });
    }

    return new Promise((resolve) => {
      waitingCallsRef.current.push({ batch, name, params: validation.params, resolve });

      runWaitingCalls();
    });
  }, [runWaitingCalls]);

  useWebMcpTools(callTool);

  const value = useMemo(() => ({ callTool }), [callTool]);

  return <AtlasToolsContext.Provider value={value}>
    {children}
  </AtlasToolsContext.Provider>;
};

export const useAtlasTools = () => useContext(AtlasToolsContext);

export default AtlasToolsProvider;
