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

/* Offers the Atlas tools to browser agents through WebMCP, when it is turned
   on and the browser has it. The app only renders this for a signed-in user,
   so the tools go away with the session. */
const useWebMcpTools = (callTool) => {
  const callToolRef = useRef(callTool);
  useEffect(() => {
    callToolRef.current = callTool;
  });

  useEffect(() => {
    const modelContext = getModelContext();
    if (REACT_APP_ENABLE_WEBMCP !== 'true' || typeof modelContext?.registerTool !== 'function') return;

    const failedNames = new Set();
    ATLAS_TOOLS.forEach(async ({ annotations, description, inputSchema, name }) => {
      const isRegistered = await callSafely(`register ${name}`, () => modelContext.registerTool({
        annotations,
        description,
        execute: (args) => callToolRef.current(name, args).catch((error) => toolErrorResult(error.message)),
        inputSchema,
        name,
      }));

      if (!isRegistered) failedNames.add(name);
    });

    return () => ATLAS_TOOLS
      .filter(({ name }) => !failedNames.has(name))
      .forEach(({ name }) => callSafely(`unregister ${name}`, () => modelContext.unregisterTool(name)));
  }, []);
};

export default useWebMcpTools;
