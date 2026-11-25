import { act, renderHook } from '@testing-library/react';

import useAtlasAppActions from '../hooks/useAtlasAppActions';
import useAtlasCameraHistory from '../hooks/useAtlasCameraHistory';
import useWebMcpTools from './useWebMcpTools';

import AtlasToolsProvider, { ATLAS_STEP_TIMEOUT_MS, useAtlasTools } from './';

jest.mock('../hooks/useAtlasAppActions', () => jest.fn());

jest.mock('../hooks/useAtlasCameraHistory', () => jest.fn());

jest.mock('./useWebMcpTools', () => jest.fn());

const SUBJECT_ID = '6f1c2d3e-4b5a-4c7d-8e9f-0a1b2c3d4e5f';

const done = (text) => ({ _meta: { status: 'applied' }, content: [{ text, type: 'text' }], isError: false });
const failed = (text, status = 'refused') => ({ _meta: { status }, content: [{ text, type: 'text' }], isError: true });

const CANCELLED = failed('Cancelled, Atlas tools are no longer available.', 'cancelled');
const SUPERSEDED = failed('Skipped, superseded by a newer reply.', 'superseded');
const TIMED_OUT = failed('Moved on, the call did not finish within 15 s.', 'timeout');

const WITH_SIGNAL = { signal: expect.any(AbortSignal) };

describe('AtlasTools', () => {
  let cameraHistory, runAtlasAppAction, warn;
  beforeEach(() => {
    cameraHistory = { begin: jest.fn(), move: jest.fn() };
    useAtlasCameraHistory.mockImplementation(() => cameraHistory);
    runAtlasAppAction = jest.fn(({ action }) => Promise.resolve(done(`Ran ${action}.`)));
    useAtlasAppActions.mockImplementation(() => runAtlasAppAction);
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
  });

  const renderAtlasToolsHook = () => renderHook(() => useAtlasTools(), { wrapper: AtlasToolsProvider });

  const renderAtlasTools = () => renderAtlasToolsHook().result.current;

  const getSignal = (index) => runAtlasAppAction.mock.calls[index][1].signal;

  const getRunActions = () => runAtlasAppAction.mock.calls.map(([{ action }]) => action);

  // Each deferred run resolves when its finish is called, once it has started.
  const deferRuns = (count) => {
    const resolvers = [];
    for (let index = 0; index < count; index += 1) {
      runAtlasAppAction.mockImplementationOnce(({ action }) => new Promise((resolve) => {
        resolvers[index] = () => resolve(done(`Ran ${action}.`));
      }));
    }

    return Array.from({ length: count }, (_, index) => () => act(async () => resolvers[index]()));
  };

  const flush = () => act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  test('shares its camera history with the tools', () => {
    renderAtlasTools();

    expect(useAtlasAppActions).toHaveBeenCalledWith(cameraHistory);
  });

  test('offers its tools through WebMCP', () => {
    const { callTool } = renderAtlasTools();

    expect(useWebMcpTools).toHaveBeenCalledWith(callTool);
  });

  test('runs a valid call with its checked arguments, and resolves to its result', async () => {
    const { callTool } = renderAtlasTools();

    const result = await callTool('subject-track', { ids: [SUBJECT_ID, SUBJECT_ID], since: '2026-11-01T00:00:00+03:00' });

    expect(runAtlasAppAction).toHaveBeenCalledWith({
      action: 'subject-track',
      ids: [SUBJECT_ID],
      since: '2026-10-31T21:00:00.000Z',
    }, WITH_SIGNAL);
    expect(result).toEqual(done('Ran subject-track.'));
  });

  test('rejects invalid arguments with a JSON-RPC invalid params error, without running anything', async () => {
    const { callTool } = renderAtlasTools();

    await expect(callTool('subject-popup', { id: 'Kito' })).rejects.toEqual({
      code: -32602,
      message: expect.stringContaining('Invalid arguments for subject-popup'),
    });
    expect(runAtlasAppAction).not.toHaveBeenCalled();
  });

  test('rejects an unknown tool with a JSON-RPC invalid params error', async () => {
    const { callTool } = renderAtlasTools();

    await expect(callTool('delete-everything', {})).rejects.toEqual({
      code: -32602,
      message: 'Unknown tool: delete-everything',
    });
    expect(runAtlasAppAction).not.toHaveBeenCalled();
  });

  test('resolves a call that throws to an error result, and keeps going', async () => {
    runAtlasAppAction.mockImplementationOnce(() => Promise.reject(new Error('boom')));
    const { callTool } = renderAtlasTools();

    const results = await Promise.all([
      callTool('report-heatmap', { on: true }),
      callTool('report-heatmap', { on: false }),
    ]);

    expect(results).toEqual([failed('Failed: boom'), done('Ran report-heatmap.')]);
  });

  test('resolves a call that throws before returning a promise to an error result, and keeps going', async () => {
    runAtlasAppAction.mockImplementationOnce(() => {
      throw new Error('boom');
    });
    const { callTool } = renderAtlasTools();

    const results = await Promise.all([
      callTool('report-heatmap', { on: true }),
      callTool('report-heatmap', { on: false }),
    ]);

    expect(results).toEqual([failed('Failed: boom'), done('Ran report-heatmap.')]);
  });

  test('gives each call its own signal, not aborted once it finishes', async () => {
    const { callTool } = renderAtlasTools();

    await callTool('report-heatmap', { on: true });
    await callTool('report-heatmap', { on: false });

    expect(getSignal(0)).not.toBe(getSignal(1));
    expect(getSignal(0).aborted).toBe(false);
    expect(getSignal(1).aborted).toBe(false);
  });

  test('runs calls one at a time, in the order they arrive', async () => {
    const [finishFirst] = deferRuns(1);
    const { callTool } = renderAtlasTools();

    const first = callTool('report-heatmap', { on: true });
    const second = callTool('jump-to', { coordinates: [1, 2] });
    await flush();

    expect(runAtlasAppAction).toHaveBeenCalledTimes(1);

    await finishFirst();
    await flush();

    expect(runAtlasAppAction).toHaveBeenCalledTimes(2);
    expect(runAtlasAppAction).toHaveBeenLastCalledWith({ action: 'jump-to', coordinates: [1, 2] }, WITH_SIGNAL);
    await expect(first).resolves.toEqual(done('Ran report-heatmap.'));
    await expect(second).resolves.toEqual(done('Ran jump-to.'));
  });

  test('queues the calls of WebMCP behind those of Atlas', async () => {
    const [finishFirst] = deferRuns(1);
    const { callTool } = renderAtlasTools();
    const callToolFromWebMcp = useWebMcpTools.mock.calls.at(-1)[0];

    callTool('report-heatmap', { on: true });
    callToolFromWebMcp('report-heatmap', { on: false });
    await flush();

    expect(runAtlasAppAction).toHaveBeenCalledTimes(1);

    await finishFirst();
    await flush();

    expect(runAtlasAppAction).toHaveBeenCalledTimes(2);
  });

  describe('the start of a call', () => {
    test('is reported when the call leaves the queue, just before it runs', async () => {
      const [finishFirst] = deferRuns(1);
      const { callTool } = renderAtlasTools();
      const onFirstStart = jest.fn(() => expect(runAtlasAppAction).not.toHaveBeenCalled());
      const onSecondStart = jest.fn(() => expect(runAtlasAppAction).toHaveBeenCalledTimes(1));

      callTool('report-heatmap', { on: true }, { onStart: onFirstStart });
      const second = callTool('jump-to', { coordinates: [1, 2] }, { onStart: onSecondStart });
      await flush();

      expect(onFirstStart).toHaveBeenCalledTimes(1);
      expect(onSecondStart).not.toHaveBeenCalled();

      await finishFirst();
      await second;

      expect(onFirstStart).toHaveBeenCalledTimes(1);
      expect(onSecondStart).toHaveBeenCalledTimes(1);
    });

    test('is not reported for a call dropped by a newer batch before it starts', async () => {
      deferRuns(1);
      const { callTool } = renderAtlasTools();
      const onStart = jest.fn();

      callTool('report-heatmap', { on: true }, { batch: 'reply-1' });
      const waiting = callTool('jump-to', { coordinates: [1, 2] }, { batch: 'reply-1', onStart });
      await flush();
      await callTool('report-heatmap', { on: false }, { batch: 'reply-2' });

      await expect(waiting).resolves.toEqual(SUPERSEDED);
      expect(onStart).not.toHaveBeenCalled();
    });

    test('is not reported for a call cancelled before it starts', async () => {
      deferRuns(1);
      const { result, unmount } = renderAtlasToolsHook();
      const onStart = jest.fn();

      result.current.callTool('report-heatmap', { on: true });
      const waiting = result.current.callTool('jump-to', { coordinates: [1, 2] }, { onStart });
      await flush();
      unmount();
      await flush();

      await expect(waiting).resolves.toEqual(CANCELLED);
      expect(onStart).not.toHaveBeenCalled();
    });

    test('does not stop the call when reporting it fails', async () => {
      const { callTool } = renderAtlasTools();

      const result = await callTool('report-heatmap', { on: true }, {
        onStart: () => {
          throw new Error('gone');
        },
      });

      expect(result).toEqual(done('Ran report-heatmap.'));
      expect(warn).toHaveBeenCalledWith('[atlas-tools] report-heatmap: could not report its start', expect.any(Error));
    });
  });

  describe('batches', () => {
    test('drops the waiting calls of an older batch once a newer batch arrives', async () => {
      deferRuns(1);
      const { callTool } = renderAtlasTools();

      callTool('report-heatmap', { on: true }, { batch: 'reply-1' });
      const waiting = callTool('jump-to', { coordinates: [1, 2] }, { batch: 'reply-1' });
      await flush();
      const newer = callTool('report-heatmap', { on: false }, { batch: 'reply-2' });

      await expect(waiting).resolves.toEqual(SUPERSEDED);
      expect(warn).toHaveBeenCalledWith('[atlas-tools] jump-to: skipped, a newer Atlas reply arrived');
      await expect(newer).resolves.toEqual(done('Ran report-heatmap.'));
      expect(getRunActions()).toEqual(['report-heatmap', 'report-heatmap']);
    });

    test('stops the running call of an older batch at once, aborting its signal, and runs the newer one', async () => {
      const [finishFirst] = deferRuns(1);
      const { callTool } = renderAtlasTools();

      const running = callTool('subject-popup', { id: SUBJECT_ID }, { batch: 'reply-1' });
      await flush();
      const newer = callTool('jump-to', { coordinates: [1, 2] }, { batch: 'reply-2' });

      await expect(running).resolves.toEqual(SUPERSEDED);
      expect(getSignal(0).aborted).toBe(true);
      expect(warn).toHaveBeenCalledWith('[atlas-tools] subject-popup: stopped, a newer Atlas reply arrived');
      await expect(newer).resolves.toEqual(done('Ran jump-to.'));
      expect(getSignal(1).aborted).toBe(false);

      // Its late result changes nothing.
      await finishFirst();

      await expect(running).resolves.toEqual(SUPERSEDED);
    });

    test('does not stop the running call of the same batch', async () => {
      const [finishFirst] = deferRuns(1);
      const { callTool } = renderAtlasTools();

      const running = callTool('report-heatmap', { on: true }, { batch: 'reply-1' });
      await flush();
      callTool('jump-to', { coordinates: [1, 2] }, { batch: 'reply-1' });
      await finishFirst();

      await expect(running).resolves.toEqual(done('Ran report-heatmap.'));
      expect(getSignal(0).aborted).toBe(false);
    });

    test('never stops a running call without a batch', async () => {
      const [finishFirst] = deferRuns(1);
      const { callTool } = renderAtlasTools();

      const running = callTool('report-heatmap', { on: true });
      await flush();
      callTool('jump-to', { coordinates: [1, 2] }, { batch: 'reply-2' });
      await finishFirst();

      await expect(running).resolves.toEqual(done('Ran report-heatmap.'));
      expect(getSignal(0).aborted).toBe(false);
    });

    test('does not let a call without a batch stop the running call of one', async () => {
      const [finishFirst] = deferRuns(1);
      const { callTool } = renderAtlasTools();

      const running = callTool('report-heatmap', { on: true }, { batch: 'reply-1' });
      await flush();
      callTool('jump-to', { coordinates: [1, 2] });
      await finishFirst();

      await expect(running).resolves.toEqual(done('Ran report-heatmap.'));
      expect(getSignal(0).aborted).toBe(false);
    });

    test('keeps the waiting calls of the same batch', async () => {
      const [finishFirst] = deferRuns(1);
      const { callTool } = renderAtlasTools();

      callTool('report-heatmap', { on: true }, { batch: 'reply-1' });
      const waiting = callTool('jump-to', { coordinates: [1, 2] }, { batch: 'reply-1' });
      await flush();
      await finishFirst();

      await expect(waiting).resolves.toEqual(done('Ran jump-to.'));
    });

    test('never drops a call without a batch', async () => {
      const [finishFirst] = deferRuns(1);
      const { callTool } = renderAtlasTools();

      callTool('report-heatmap', { on: true }, { batch: 'reply-1' });
      const unbatched = callTool('jump-to', { coordinates: [1, 2] });
      await flush();
      callTool('report-heatmap', { on: false }, { batch: 'reply-2' });
      await finishFirst();

      await expect(unbatched).resolves.toEqual(done('Ran jump-to.'));
    });

    test('does not let a call without a batch drop the waiting calls of one', async () => {
      const [finishFirst] = deferRuns(1);
      const { callTool } = renderAtlasTools();

      callTool('report-heatmap', { on: true }, { batch: 'reply-1' });
      const waiting = callTool('jump-to', { coordinates: [1, 2] }, { batch: 'reply-1' });
      await flush();
      callTool('report-heatmap', { on: false });
      await finishFirst();

      await expect(waiting).resolves.toEqual(done('Ran jump-to.'));
    });

    test('runs the calls of the newer batch in order after the one running without a batch', async () => {
      const [finishFirst] = deferRuns(1);
      const { callTool } = renderAtlasTools();

      callTool('report-heatmap', { on: true });
      await flush();
      callTool('jump-to', { coordinates: [1, 2] }, { batch: 'reply-2' });
      callTool('fit-bounds', { bbox: [1, 2, 3, 4] }, { batch: 'reply-2' });
      await flush();

      expect(getRunActions()).toEqual(['report-heatmap']);

      await finishFirst();
      await flush();

      expect(getRunActions()).toEqual(['report-heatmap', 'jump-to', 'fit-bounds']);
    });
  });

  describe('when a call does not finish', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      runAtlasAppAction.mockImplementationOnce(() => new Promise(() => {}));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    const advanceTimersBy = (milliseconds) => act(() => jest.advanceTimersByTimeAsync(milliseconds));

    test('resolves it to an error and runs the next once it runs out of time', async () => {
      const { callTool } = renderAtlasTools();

      const stuck = callTool('report-heatmap', { on: true });
      const next = callTool('report-heatmap', { on: false });
      await advanceTimersBy(ATLAS_STEP_TIMEOUT_MS - 1);

      expect(runAtlasAppAction).toHaveBeenCalledTimes(1);

      await advanceTimersBy(1);

      await expect(stuck).resolves.toEqual(TIMED_OUT);
      await expect(next).resolves.toEqual(done('Ran report-heatmap.'));
      expect(runAtlasAppAction).toHaveBeenLastCalledWith({ action: 'report-heatmap', on: false }, WITH_SIGNAL);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('report-heatmap'));
    });

    test('aborts its signal once it runs out of time, and only then', async () => {
      const { callTool } = renderAtlasTools();

      callTool('report-heatmap', { on: true });
      await advanceTimersBy(ATLAS_STEP_TIMEOUT_MS - 1);

      expect(getSignal(0).aborted).toBe(false);

      await advanceTimersBy(1);

      expect(getSignal(0).aborted).toBe(true);
    });
  });

  describe('once unmounted', () => {
    test('aborts the running call, and resolves it and every waiting call as cancelled', async () => {
      deferRuns(1);
      const { result, unmount } = renderAtlasToolsHook();
      const { callTool } = result.current;

      const running = callTool('report-heatmap', { on: true }, { batch: 'reply-1' });
      const waiting = callTool('jump-to', { coordinates: [1, 2] }, { batch: 'reply-1' });
      const unbatched = callTool('fit-bounds', { bbox: [1, 2, 3, 4] });
      await flush();

      unmount();

      await expect(running).resolves.toEqual(CANCELLED);
      await expect(waiting).resolves.toEqual(CANCELLED);
      await expect(unbatched).resolves.toEqual(CANCELLED);
      expect(getSignal(0).aborted).toBe(true);
      await flush();
      expect(getRunActions()).toEqual(['report-heatmap']);
    });

    test('resolves a later call as cancelled without running it', async () => {
      const { result, unmount } = renderAtlasToolsHook();
      const { callTool } = result.current;
      unmount();

      await expect(callTool('report-heatmap', { on: true })).resolves.toEqual(CANCELLED);
      expect(runAtlasAppAction).not.toHaveBeenCalled();
    });

    test('still rejects a later invalid call as invalid', async () => {
      const { result, unmount } = renderAtlasToolsHook();
      const { callTool } = result.current;
      unmount();

      await expect(callTool('report-heatmap', {})).rejects.toEqual(expect.objectContaining({ code: -32602 }));
    });
  });
});
