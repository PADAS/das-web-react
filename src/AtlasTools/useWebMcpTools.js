import { useEffect, useRef } from 'react';

import { ATLAS_TOOLS } from '../utils/atlas-tools/validate';
import { REACT_APP_ENABLE_WEBMCP } from '../constants';
import { toolErrorResult } from '../utils/atlas-tools/results';

const getModelContext = () => document.modelContext ?? navigator.modelContext;

// registerTool and unregisterTool may return a promise, or throw.
const callSafely = async (description, call) => {
  try {
    await call();

    return true;
  } catch (error) {
    console.warn(`[atlas-tools] WebMCP could not ${description}`, error);

    return false;
  }
};

const isDuplicateError = (error) => error?.name === 'InvalidStateError';

/* Offers the Atlas tools to browser agents through WebMCP, when it is turned
   on and the browser has it. The app only renders this for a signed-in user,
   so the tools go away with the session.

   The WebMCP draft unregisters a tool when the signal it was registered with
   aborts. Older browsers have unregisterTool instead, so it is called too
   where it exists. */
const useWebMcpTools = (callTool) => {
  const callToolRef = useRef(callTool);
  useEffect(() => {
    callToolRef.current = callTool;
  });

  useEffect(() => {
    const modelContext = getModelContext();
    if (REACT_APP_ENABLE_WEBMCP !== 'true' || typeof modelContext?.registerTool !== 'function') return;

    const canUnregister = typeof modelContext.unregisterTool === 'function';
    const controller = new AbortController();
    const registeredNames = new Set();
    let hasWarnedOfDuplicates = false;

    const unregisterTool = (name) => {
      registeredNames.delete(name);
      callSafely(`unregister ${name}`, () => modelContext.unregisterTool(name));
    };

    const onRegistered = (name) => {
      registeredNames.add(name);

      // Unmounted while registering, after the unregistering.
      if (controller.signal.aborted && canUnregister) unregisterTool(name);
    };

    const registerTool = async ({ annotations, description, inputSchema, name }) => {
      const register = () => modelContext.registerTool(
        {
          // Of the MCP hints, the draft's ToolAnnotations only define readOnlyHint.
          annotations: { readOnlyHint: annotations?.readOnlyHint ?? false },
          description,
          execute: (args) => callToolRef.current(name, args).catch((error) => toolErrorResult(error.message)),
          inputSchema,
          name,
        },
        { signal: controller.signal }
      );

      try {
        await register();

        onRegistered(name);

        return;
      } catch (error) {
        if (!isDuplicateError(error)) {
          console.warn(`[atlas-tools] WebMCP could not register ${name}`, error);

          return;
        }
      }

      // An earlier mount that could not unregister left its tool behind.
      if (!canUnregister) {
        if (!hasWarnedOfDuplicates) {
          hasWarnedOfDuplicates = true;
          console.warn('[atlas-tools] WebMCP already has Atlas tools from before, and cannot replace them');
        }

        return;
      }

      const isRegistered = await callSafely(`register ${name}`, async () => {
        await modelContext.unregisterTool(name);
        await register();
      });
      if (isRegistered) onRegistered(name);
    };

    ATLAS_TOOLS.forEach(registerTool);

    return () => {
      controller.abort();

      if (canUnregister) [...registeredNames].forEach(unregisterTool);
    };
  }, []);
};

export default useWebMcpTools;
