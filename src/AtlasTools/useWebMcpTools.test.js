import { renderHook, waitFor } from '@testing-library/react';

import { ATLAS_TOOL_NAMES, ATLAS_TOOLS } from '../utils/atlas-tools/validate';

import useWebMcpTools from './useWebMcpTools';

let mockIsWebMcpEnabled;
jest.mock('../constants', () => ({
  ...jest.requireActual('../constants'),
  get REACT_APP_ENABLE_WEBMCP() {
    return mockIsWebMcpEnabled;
  },
}));

const done = (text) => ({ content: [{ text, type: 'text' }], isError: false });

const duplicateError = () => Object.assign(new Error('A tool with this name is already registered'), { name: 'InvalidStateError' });

// As the WebMCP draft has it: a promise, unregistered by aborting the signal,
// a duplicate name rejected, and no unregisterTool.
const createSignalModelContext = () => {
  const tools = new Map();

  return {
    registerTool: jest.fn((tool, { signal } = {}) => {
      if (tools.has(tool.name)) return Promise.reject(duplicateError());

      tools.set(tool.name, tool);
      signal?.addEventListener('abort', () => tools.delete(tool.name));

      return Promise.resolve();
    }),
    tools,
  };
};

// As older Chrome builds have it: unregistered by name.
const createLegacyModelContext = () => {
  const tools = new Map();

  return {
    registerTool: jest.fn((tool) => {
      if (tools.has(tool.name)) throw duplicateError();

      tools.set(tool.name, tool);
    }),
    tools,
    unregisterTool: jest.fn((name) => {
      tools.delete(name);
    }),
  };
};

describe('AtlasTools - useWebMcpTools', () => {
  let callTool, warn;
  beforeEach(() => {
    mockIsWebMcpEnabled = 'true';
    callTool = jest.fn(() => Promise.resolve(done('Ran it.')));
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    delete document.modelContext;
    delete navigator.modelContext;
    warn.mockRestore();
  });

  const renderWebMcpTools = () => renderHook(() => useWebMcpTools(callTool));

  const waitForRegistrations = (modelContext, count = ATLAS_TOOLS.length) => waitFor(
    () => expect(modelContext.tools.size).toBe(count)
  );

  describe('with the signal-based API of the WebMCP draft', () => {
    let modelContext;
    beforeEach(() => {
      modelContext = createSignalModelContext();
      document.modelContext = modelContext;
    });

    test('registers every tool with its description, input schema and read-only hint, and a signal', async () => {
      renderWebMcpTools();

      await waitForRegistrations(modelContext);
      expect(modelContext.registerTool).toHaveBeenCalledTimes(ATLAS_TOOLS.length);
      ATLAS_TOOLS.forEach(({ description, inputSchema, name }) => {
        expect(modelContext.registerTool).toHaveBeenCalledWith(
          { annotations: { readOnlyHint: false }, description, execute: expect.any(Function), inputSchema, name },
          { signal: expect.any(AbortSignal) }
        );
      });
    });

    test('registers every tool with one signal per mount', () => {
      renderWebMcpTools();

      const signals = new Set(modelContext.registerTool.mock.calls.map(([, { signal }]) => signal));
      expect(signals.size).toBe(1);
    });

    test('unregisters every tool by aborting the signal once unmounted', async () => {
      const { unmount } = renderWebMcpTools();
      await waitForRegistrations(modelContext);
      const [[, { signal }]] = modelContext.registerTool.mock.calls;

      unmount();

      expect(signal.aborted).toBe(true);
      expect(modelContext.tools.size).toBe(0);
      expect(warn).not.toHaveBeenCalled();
    });

    test('registers again after a remount', async () => {
      const { unmount } = renderWebMcpTools();
      await waitForRegistrations(modelContext);
      unmount();

      renderWebMcpTools();

      await waitForRegistrations(modelContext);
      expect(warn).not.toHaveBeenCalled();
    });

    test('warns once when tools of the same names are there already, as it cannot replace them', async () => {
      ATLAS_TOOL_NAMES.forEach((name) => modelContext.tools.set(name, { name }));

      renderWebMcpTools();

      await waitFor(() => expect(modelContext.registerTool).toHaveBeenCalledTimes(ATLAS_TOOLS.length));
      await waitFor(() => expect(warn).toHaveBeenCalledTimes(1));
      expect(warn).toHaveBeenCalledWith('[atlas-tools] WebMCP already has Atlas tools from before, and cannot replace them');
    });

    test('runs a tool through the call it was given', async () => {
      renderWebMcpTools();
      await waitForRegistrations(modelContext);

      const result = await modelContext.tools.get('jump-to').execute({ coordinates: [1, 2] });

      expect(callTool).toHaveBeenCalledWith('jump-to', { coordinates: [1, 2] });
      expect(result).toEqual(done('Ran it.'));
    });

    test('runs a tool through the latest call it was given', async () => {
      const { rerender } = renderWebMcpTools();
      await waitForRegistrations(modelContext);
      const latestCallTool = jest.fn(() => Promise.resolve(done('Ran it later.')));
      callTool = latestCallTool;
      rerender();

      const result = await modelContext.tools.get('jump-to').execute({ coordinates: [1, 2] });

      expect(latestCallTool).toHaveBeenCalledWith('jump-to', { coordinates: [1, 2] });
      expect(result).toEqual(done('Ran it later.'));
    });

    test('turns a rejected call into an error result', async () => {
      callTool.mockImplementation(() => Promise.reject({ code: -32602, message: 'Invalid arguments for jump-to: nope' }));
      renderWebMcpTools();
      await waitForRegistrations(modelContext);

      const result = await modelContext.tools.get('jump-to').execute({});

      expect(result).toEqual({ content: [{ text: 'Invalid arguments for jump-to: nope', type: 'text' }], isError: true });
    });

    test('keeps registering after a tool fails, and warns', async () => {
      const error = new Error('nope');
      modelContext.registerTool.mockImplementationOnce(() => Promise.reject(error));

      renderWebMcpTools();

      await waitForRegistrations(modelContext, ATLAS_TOOLS.length - 1);
      expect(warn).toHaveBeenCalledWith(`[atlas-tools] WebMCP could not register ${ATLAS_TOOL_NAMES[0]}`, error);
    });
  });

  describe('with the legacy unregisterTool API', () => {
    let modelContext;
    beforeEach(() => {
      modelContext = createLegacyModelContext();
      document.modelContext = modelContext;
    });

    test('registers every tool', async () => {
      renderWebMcpTools();

      await waitForRegistrations(modelContext);
      expect(modelContext.registerTool).toHaveBeenCalledTimes(ATLAS_TOOLS.length);
    });

    test('also unregisters every tool by name once unmounted', async () => {
      const { unmount } = renderWebMcpTools();
      await waitForRegistrations(modelContext);
      const [[, { signal }]] = modelContext.registerTool.mock.calls;

      unmount();

      expect(signal.aborted).toBe(true);
      expect(modelContext.unregisterTool).toHaveBeenCalledTimes(ATLAS_TOOLS.length);
      ATLAS_TOOL_NAMES.forEach((name) => expect(modelContext.unregisterTool).toHaveBeenCalledWith(name));
      expect(modelContext.tools.size).toBe(0);
    });

    test('unregisters a tool whose registration ends after the unmount', async () => {
      let finishRegistering;
      modelContext.registerTool.mockImplementationOnce((tool) => new Promise((resolve) => {
        finishRegistering = () => {
          modelContext.tools.set(tool.name, tool);
          resolve();
        };
      }));
      const { unmount } = renderWebMcpTools();
      await waitForRegistrations(modelContext, ATLAS_TOOLS.length - 1);

      unmount();
      finishRegistering();

      await waitFor(() => expect(modelContext.unregisterTool).toHaveBeenCalledWith(ATLAS_TOOL_NAMES[0]));
      expect(modelContext.tools.size).toBe(0);
    });

    test('replaces a tool an earlier mount left behind, and registers it once more', async () => {
      const staleTool = { name: 'jump-to' };
      modelContext.tools.set('jump-to', staleTool);

      renderWebMcpTools();

      await waitForRegistrations(modelContext);
      expect(modelContext.unregisterTool).toHaveBeenCalledWith('jump-to');
      expect(modelContext.tools.get('jump-to')).not.toBe(staleTool);
      expect(modelContext.registerTool.mock.calls.filter(([{ name }]) => name === 'jump-to')).toHaveLength(2);
      expect(warn).not.toHaveBeenCalled();
    });

    test('warns when the tool registers neither time', async () => {
      modelContext.registerTool.mockImplementation(() => {
        throw duplicateError();
      });

      renderWebMcpTools();

      await waitFor(() => expect(warn).toHaveBeenCalledTimes(ATLAS_TOOLS.length));
      expect(warn).toHaveBeenCalledWith('[atlas-tools] WebMCP could not register jump-to', expect.any(Error));
    });

    test('does not unregister a tool that never registered', async () => {
      modelContext.registerTool.mockImplementation((tool) => {
        if (tool.name === 'jump-to') throw new Error('nope');

        modelContext.tools.set(tool.name, tool);
      });
      const { unmount } = renderWebMcpTools();
      await waitForRegistrations(modelContext, ATLAS_TOOLS.length - 1);

      unmount();

      expect(modelContext.unregisterTool).not.toHaveBeenCalledWith('jump-to');
      expect(modelContext.unregisterTool).toHaveBeenCalledTimes(ATLAS_TOOLS.length - 1);
    });

    test('keeps unregistering after a tool throws, and warns', async () => {
      const error = new Error('nope');
      modelContext.unregisterTool.mockImplementationOnce(() => {
        throw error;
      });
      const { unmount } = renderWebMcpTools();
      await waitForRegistrations(modelContext);

      unmount();

      expect(modelContext.unregisterTool).toHaveBeenCalledTimes(ATLAS_TOOLS.length);
      await waitFor(() => expect(warn).toHaveBeenCalledWith(
        `[atlas-tools] WebMCP could not unregister ${ATLAS_TOOL_NAMES[0]}`,
        error
      ));
    });
  });

  test('falls back to the navigator model context', async () => {
    const modelContext = createSignalModelContext();
    navigator.modelContext = modelContext;

    renderWebMcpTools();

    await waitForRegistrations(modelContext);
    expect(modelContext.registerTool).toHaveBeenCalledTimes(ATLAS_TOOLS.length);
  });

  test('prefers the document model context', () => {
    const modelContext = createSignalModelContext();
    const navigatorModelContext = createSignalModelContext();
    document.modelContext = modelContext;
    navigator.modelContext = navigatorModelContext;

    renderWebMcpTools();

    expect(modelContext.registerTool).toHaveBeenCalled();
    expect(navigatorModelContext.registerTool).not.toHaveBeenCalled();
  });

  test.each([
    ['off', 'false'],
    ['not set', undefined],
    ['set to anything but true', '1'],
  ])('registers nothing when WebMCP is %s', (_, flag) => {
    mockIsWebMcpEnabled = flag;
    const modelContext = createSignalModelContext();
    document.modelContext = modelContext;

    renderWebMcpTools();

    expect(modelContext.registerTool).not.toHaveBeenCalled();
  });

  test('does nothing when the browser has no model context', () => {
    expect(() => renderWebMcpTools()).not.toThrow();
  });
});
