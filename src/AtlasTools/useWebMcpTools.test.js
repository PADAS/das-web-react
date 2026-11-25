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

describe('AtlasTools - useWebMcpTools', () => {
  let callTool, modelContext, warn;
  beforeEach(() => {
    mockIsWebMcpEnabled = 'true';
    callTool = jest.fn(() => Promise.resolve(done('Ran it.')));
    modelContext = { registerTool: jest.fn(), unregisterTool: jest.fn() };
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    delete document.modelContext;
    delete navigator.modelContext;
    warn.mockRestore();
  });

  const renderWebMcpTools = () => renderHook(() => useWebMcpTools(callTool));

  const getRegisteredTool = (name) => modelContext.registerTool.mock.calls
    .map(([tool]) => tool)
    .find((tool) => tool.name === name);

  test('registers every tool with its description, input schema and annotations', () => {
    document.modelContext = modelContext;

    renderWebMcpTools();

    expect(modelContext.registerTool).toHaveBeenCalledTimes(ATLAS_TOOLS.length);
    ATLAS_TOOLS.forEach((tool) => {
      expect(modelContext.registerTool).toHaveBeenCalledWith({ ...tool, execute: expect.any(Function) });
    });
  });

  test('falls back to the navigator model context', () => {
    navigator.modelContext = modelContext;

    renderWebMcpTools();

    expect(modelContext.registerTool).toHaveBeenCalledTimes(ATLAS_TOOLS.length);
  });

  test('prefers the document model context', () => {
    const navigatorModelContext = { registerTool: jest.fn(), unregisterTool: jest.fn() };
    document.modelContext = modelContext;
    navigator.modelContext = navigatorModelContext;

    renderWebMcpTools();

    expect(modelContext.registerTool).toHaveBeenCalled();
    expect(navigatorModelContext.registerTool).not.toHaveBeenCalled();
  });

  test.each([
    ['off', 'false'],
    ['not set', undefined],
  ])('registers nothing when WebMCP is %s', (_, flag) => {
    mockIsWebMcpEnabled = flag;
    document.modelContext = modelContext;

    renderWebMcpTools();

    expect(modelContext.registerTool).not.toHaveBeenCalled();
  });

  test('does nothing when the browser has no model context', () => {
    expect(() => renderWebMcpTools()).not.toThrow();
  });

  test('unregisters every tool once unmounted', async () => {
    document.modelContext = modelContext;
    const { unmount } = renderWebMcpTools();
    await waitFor(() => expect(modelContext.registerTool).toHaveBeenCalledTimes(ATLAS_TOOLS.length));

    unmount();

    expect(modelContext.unregisterTool).toHaveBeenCalledTimes(ATLAS_TOOLS.length);
    ATLAS_TOOL_NAMES.forEach((name) => expect(modelContext.unregisterTool).toHaveBeenCalledWith(name));
  });

  test('runs a tool through the call it was given', async () => {
    document.modelContext = modelContext;
    renderWebMcpTools();

    const result = await getRegisteredTool('jump-to').execute({ coordinates: [1, 2] });

    expect(callTool).toHaveBeenCalledWith('jump-to', { coordinates: [1, 2] });
    expect(result).toEqual(done('Ran it.'));
  });

  test('turns a rejected call into an error result', async () => {
    callTool.mockImplementation(() => Promise.reject({ code: -32602, message: 'Invalid arguments for jump-to: nope' }));
    document.modelContext = modelContext;
    renderWebMcpTools();

    const result = await getRegisteredTool('jump-to').execute({});

    expect(result).toEqual({ content: [{ text: 'Invalid arguments for jump-to: nope', type: 'text' }], isError: true });
  });

  test('keeps registering after a tool throws, and warns', () => {
    modelContext.registerTool.mockImplementationOnce(() => {
      throw new Error('nope');
    });
    document.modelContext = modelContext;

    renderWebMcpTools();

    expect(modelContext.registerTool).toHaveBeenCalledTimes(ATLAS_TOOLS.length);
    expect(warn).toHaveBeenCalledWith(`[atlas-tools] WebMCP could not register ${ATLAS_TOOL_NAMES[0]}`, expect.any(Error));
  });

  test('waits for a registration that returns a promise, and warns when it fails', async () => {
    modelContext.registerTool.mockImplementation(({ name }) => (name === 'jump-to'
      ? Promise.reject(new Error('nope'))
      : Promise.resolve()));
    document.modelContext = modelContext;
    const { unmount } = renderWebMcpTools();

    await waitFor(() => expect(warn).toHaveBeenCalledWith('[atlas-tools] WebMCP could not register jump-to', expect.any(Error)));
    unmount();

    expect(modelContext.unregisterTool).not.toHaveBeenCalledWith('jump-to');
    expect(modelContext.unregisterTool).toHaveBeenCalledTimes(ATLAS_TOOLS.length - 1);
  });

  test('keeps unregistering after a tool throws, and warns', async () => {
    modelContext.unregisterTool.mockImplementationOnce(() => {
      throw new Error('nope');
    });
    document.modelContext = modelContext;
    const { unmount } = renderWebMcpTools();

    unmount();

    expect(modelContext.unregisterTool).toHaveBeenCalledTimes(ATLAS_TOOLS.length);
    await waitFor(() => expect(warn).toHaveBeenCalledWith(
      `[atlas-tools] WebMCP could not unregister ${ATLAS_TOOL_NAMES[0]}`,
      expect.any(Error)
    ));
  });

  test('warns when unregistering returns a failed promise', async () => {
    modelContext.unregisterTool.mockImplementation(() => Promise.reject(new Error('nope')));
    document.modelContext = modelContext;
    const { unmount } = renderWebMcpTools();

    unmount();

    await waitFor(() => expect(warn).toHaveBeenCalledTimes(ATLAS_TOOLS.length));
  });
});
