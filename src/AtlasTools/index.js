import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';

import { TOOL_STATUSES, toolErrorResult } from '../utils/atlas-tools/results';
import useAtlasAppActions from '../hooks/useAtlasAppActions';
import useAtlasCameraHistory from '../hooks/useAtlasCameraHistory';
import { validateToolCall } from '../utils/atlas-tools/validate';
import useWebMcpTools from './useWebMcpTools';

// Longer than the slowest tool's own waits, about 10 seconds in all.
export const ATLAS_STEP_TIMEOUT_MS = 15_000;
export const JSON_RPC_ERROR_CODES = { INVALID_PARAMS: -32602, METHOD_NOT_FOUND: -32601 };

const CANCELLED_TEXT = 'Cancelled, Atlas tools are no longer available.';
const SUPERSEDED_TEXT = 'Skipped, superseded by a newer reply.';
const TIMEOUT_TEXT = `Moved on, the call did not finish within ${ATLAS_STEP_TIMEOUT_MS / 1000} s.`;

const AtlasToolsContext = createContext(null);

const isOfOlderBatch = (call, batch) => call.batch !== undefined && call.batch !== batch;

/* Runs the tools Atlas (and, with WebMCP, any browser agent) calls, one at a
   time in the order they arrive, since tools await routes and data. A call
   with a batch (one Atlas reply) makes its batch the current one, and the
   calls of an older batch are dropped, the running one included; a call
   without one never is. A call given up on (dropped, or out of time) is
   aborted, so it changes nothing more in the app. onStart is called when a
   call leaves the queue and starts running. */
const AtlasToolsProvider = ({ children }) => {
  const cameraHistory = useAtlasCameraHistory();
  const runAtlasAppAction = useAtlasAppActions(cameraHistory);

  const runAtlasAppActionRef = useRef(runAtlasAppAction);
  useEffect(() => {
    runAtlasAppActionRef.current = runAtlasAppAction;
  });

  const currentBatchRef = useRef(null);
  const isRunningRef = useRef(false);
  const isUnmountedRef = useRef(false);
  const runningCallRef = useRef(null);
  const waitingCallsRef = useRef([]);

  // Resolves to the call's result, or to the result it was stopped with.
  const runCall = useCallback(({ batch, name, onStart, params }) => new Promise((resolve) => {
    const controller = new AbortController();
    let isFinished = false;
    let timeoutId;

    // The first of the result, the timeout and a stop wins.
    const finish = (result) => {
      if (isFinished) return;

      isFinished = true;
      clearTimeout(timeoutId);
      if (runningCallRef.current?.controller === controller) runningCallRef.current = null;
      resolve(result);
    };

    const stop = (result) => {
      controller.abort();
      finish(result);
    };

    runningCallRef.current = { batch, controller, name, stop };

    timeoutId = setTimeout(() => {
      console.warn(`[atlas-tools] ${name}: moving on after ${ATLAS_STEP_TIMEOUT_MS} ms without finishing`);

      stop(toolErrorResult(TIMEOUT_TEXT, TOOL_STATUSES.TIMEOUT));
    }, ATLAS_STEP_TIMEOUT_MS);

    try {
      onStart?.();
    } catch (error) {
      console.warn(`[atlas-tools] ${name}: could not report its start`, error);
    }

    (async () => {
      try {
        finish(await runAtlasAppActionRef.current({ action: name, ...params }, { signal: controller.signal }));
      } catch (error) {
        console.warn(`[atlas-tools] ${name}: failed`, error);

        finish(toolErrorResult(`Failed: ${error?.message ?? String(error)}`));
      }
    })();
  }), []);

  const runWaitingCalls = useCallback(async () => {
    if (isRunningRef.current) return;

    isRunningRef.current = true;
    try {
      while (waitingCallsRef.current.length && !isUnmountedRef.current) {
        const call = waitingCallsRef.current.shift();

        call.resolve(await runCall(call));
      }
    } finally {
      isRunningRef.current = false;
    }
  }, [runCall]);

  // Rejects an invalid call with a JSON-RPC error, and otherwise resolves to
  // the MCP result of the call.
  const callTool = useCallback((name, args, { batch, onStart } = {}) => {
    const validation = validateToolCall(name, args);
    if (!validation.ok) {
      return Promise.reject({ code: JSON_RPC_ERROR_CODES.INVALID_PARAMS, message: validation.message });
    }

    if (isUnmountedRef.current) return Promise.resolve(toolErrorResult(CANCELLED_TEXT, TOOL_STATUSES.CANCELLED));

    if (batch !== undefined && batch !== currentBatchRef.current) {
      currentBatchRef.current = batch;

      waitingCallsRef.current = waitingCallsRef.current.filter((call) => {
        if (!isOfOlderBatch(call, batch)) return true;

        console.warn(`[atlas-tools] ${call.name}: skipped, a newer Atlas reply arrived`);
        call.resolve(toolErrorResult(SUPERSEDED_TEXT, TOOL_STATUSES.SUPERSEDED));

        return false;
      });

      const runningCall = runningCallRef.current;
      if (runningCall && isOfOlderBatch(runningCall, batch)) {
        console.warn(`[atlas-tools] ${runningCall.name}: stopped, a newer Atlas reply arrived`);
        runningCall.stop(toolErrorResult(SUPERSEDED_TEXT, TOOL_STATUSES.SUPERSEDED));
      }
    }

    return new Promise((resolve) => {
      waitingCallsRef.current.push({ batch, name, onStart, params: validation.params, resolve });

      runWaitingCalls();
    });
  }, [runWaitingCalls]);

  // Nothing is left waiting on tools that went away with the provider.
  useEffect(() => {
    isUnmountedRef.current = false;

    return () => {
      isUnmountedRef.current = true;

      const waitingCalls = waitingCallsRef.current;
      waitingCallsRef.current = [];
      waitingCalls.forEach((call) => call.resolve(toolErrorResult(CANCELLED_TEXT, TOOL_STATUSES.CANCELLED)));

      runningCallRef.current?.stop(toolErrorResult(CANCELLED_TEXT, TOOL_STATUSES.CANCELLED));
    };
  }, []);

  useWebMcpTools(callTool);

  const value = useMemo(() => ({ callTool }), [callTool]);

  return <AtlasToolsContext.Provider value={value}>
    {children}
  </AtlasToolsContext.Provider>;
};

export const useAtlasTools = () => useContext(AtlasToolsContext);

export default AtlasToolsProvider;
