import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { render, screen } from '../../../../test-utils';
import { eventsWithGeometries } from '../../../../__test-helpers/fixtures/events';
import MapDrawingToolsContextProvider, { MapDrawingToolsContext } from '../../../../MapDrawingTools/ContextProvider';
import { mockStore } from '../../../../__test-helpers/MockStore';

import MenuPopover from '.';

describe('AreaPicker - MenuPopover', () => {
  const onBlur = jest.fn();
  const onChange = jest.fn();
  const onClose = jest.fn();
  const onPickArea = jest.fn();
  const setAreaButtonRefFocus = jest.fn();

  let event, store;
  beforeEach(() => {
    event = { ...eventsWithGeometries[1] };

    store = {
      data: {
        eventStore: {
          [event.id]: event,
        },
      },
      view: {
        mapLocationSelection: {
          isPickingLocation: false,
        },
      },
    };
  });

  const renderMenuPopover = (props, overrideStore) => render(
    <Provider store={mockStore({ ...store, ...overrideStore })}>
      <MapDrawingToolsContextProvider>
        <MenuPopover
          className="className"
          event={event}
          id="areaPicker"
          onBlur={onBlur}
          onChange={onChange}
          onClose={onClose}
          onPickArea={onPickArea}
          setAreaButtonRef={{
            current: {
              contains: () => false,
              focus: setAreaButtonRefFocus,
            },
          }}
          style={{}}
          target={{
            current: {
              contains: () => false,
              offsetWidth: 320,
            },
          }}
          {...props}
        />
      </MapDrawingToolsContextProvider>
    </Provider>
  );

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('matches the width of the target while is less than 380 and more than 280', async () => {
    renderMenuPopover();

    const menuPopover = screen.getByRole('dialog', { name: 'Area' });

    expect(menuPopover).toHaveStyle('min-width: 320px;');
    expect(menuPopover).toHaveStyle('width: 320px;');
  });

  test('sets the popover width to 280 if the target is smaller', async () => {
    renderMenuPopover({
      target: {
        current: {
          contains: () => false,
          offsetWidth: 150,
        },
      },
    });

    const menuPopover = screen.getByRole('dialog', { name: 'Area' });

    expect(menuPopover).toHaveStyle('min-width: 280px;');
    expect(menuPopover).toHaveStyle('width: 280px;');
  });

  test('sets the popover width to 380 if the target is bigger', async () => {
    renderMenuPopover({
      target: {
        current: {
          contains: () => false,
          offsetWidth: 600,
        },
      },
    });

    const menuPopover = screen.getByRole('dialog', { name: 'Area' });

    expect(menuPopover).toHaveStyle('min-width: 380px;');
    expect(menuPopover).toHaveStyle('width: 380px;');
  });

  test('closes the menu and focuses the set area button if the user presses escape', async () => {
    renderMenuPopover();

    expect(onClose).not.toHaveBeenCalled();
    expect(setAreaButtonRefFocus).not.toHaveBeenCalled();

    await userEvent.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(setAreaButtonRefFocus).toHaveBeenCalledTimes(1);
  });

  test('does neither close the menu nor focuses the set area button if the user presses escape while drawing an area', async () => {
    store.view.mapLocationSelection.isPickingLocation = true;
    renderMenuPopover();

    await userEvent.keyboard('{Escape}');

    expect(onClose).not.toHaveBeenCalled();
    expect(setAreaButtonRefFocus).not.toHaveBeenCalled();
  });

  test('shows the provenance of the area if there is one', () => {
    event.geometry.features[0].properties = { provenance: 'web' };
    renderMenuPopover({ event });

    expect(screen.getByText('Created on EarthRanger web')).toBeVisible();
  });

  test('edits the area when the user clicks the edit area button', async () => {
    renderMenuPopover();

    expect(onPickArea).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Edit area on the map' }));

    expect(onPickArea).toHaveBeenCalledTimes(1);
  });

  test('deletes the area when the user clicks the delete area button', async () => {
    const setMapDrawingData = jest.fn();
    render(
      <Provider store={mockStore(store)}>
        <MapDrawingToolsContext.Provider value={{ setMapDrawingData }}>
          <MenuPopover
            className="className"
            event={event}
            id="areaPicker"
            onBlur={onBlur}
            onChange={onChange}
            onClose={onClose}
            onPickArea={onPickArea}
            setAreaButtonRef={{
              current: {
                contains: () => false,
                focus: setAreaButtonRefFocus,
              },
            }}
            style={{}}
            target={{
              current: {
                contains: () => false,
                offsetWidth: 320,
              },
            }}
          />
        </MapDrawingToolsContext.Provider>
      </Provider>
    );

    expect(onChange).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(setMapDrawingData).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Delete Area' }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(null);
    expect(setMapDrawingData).toHaveBeenCalledTimes(1);
    expect(setMapDrawingData).toHaveBeenCalledWith(null);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('automatically focuses the edit area button ref', async () => {
    renderMenuPopover();

    expect(screen.getByRole('button', { name: 'Edit area on the map' })).toBe(document.activeElement);
  });

  test('adds a focus trap within the menu', async () => {
    renderMenuPopover();

    const editAreaButton = screen.getByRole('button', { name: 'Edit area on the map' });
    const deleteAreaButton = screen.getByRole('button', { name: 'Delete Area' });

    await userEvent.keyboard('[Tab]');

    expect(deleteAreaButton).toBe(document.activeElement);

    await userEvent.keyboard('[Tab]');

    expect(editAreaButton).toBe(document.activeElement);

    await userEvent.keyboard('{Shift>}[Tab]{/Shift}');

    expect(deleteAreaButton).toBe(document.activeElement);

    await userEvent.keyboard('{Shift>}[Tab]{/Shift}');

    expect(editAreaButton).toBe(document.activeElement);
  });

  test('closes the menu if the user clicks outside and triggers the blur callback if the click was outside of the picker', async () => {
    render(<>
      <div data-testid="outside" />

      <Provider store={mockStore(store)}>
        <MapDrawingToolsContextProvider>
          <MenuPopover
            className="className"
            event={event}
            id="areaPicker"
            onBlur={onBlur}
            onChange={onChange}
            onClose={onClose}
            onPickArea={onPickArea}
            setAreaButtonRef={{
              current: {
                contains: () => false,
                focus: setAreaButtonRefFocus,
              },
            }}
            style={{}}
            target={{
              current: {
                contains: () => false,
                offsetWidth: 320,
              },
            }}
          />
        </MapDrawingToolsContextProvider>
      </Provider>
    </>);

    expect(onClose).not.toHaveBeenCalled();
    expect(onBlur).not.toHaveBeenCalled();

    await userEvent.click(screen.getByTestId('outside'));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  test('closes the menu if the user clicks outside but does not trigger the blur callback if the click was inside the picker', async () => {
    render(<>
      <div data-testid="outside" />

      <Provider store={mockStore(store)}>
        <MapDrawingToolsContextProvider>
          <MenuPopover
            className="className"
            event={event}
            id="areaPicker"
            onBlur={onBlur}
            onChange={onChange}
            onClose={onClose}
            onPickArea={onPickArea}
            setAreaButtonRef={{
              current: {
                contains: () => false,
                focus: setAreaButtonRefFocus,
              },
            }}
            style={{}}
            target={{
              current: {
                contains: () => true,
                offsetWidth: 320,
              },
            }}
          />
        </MapDrawingToolsContextProvider>
      </Provider>
    </>);

    expect(onClose).not.toHaveBeenCalled();

    await userEvent.click(screen.getByTestId('outside'));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onBlur).not.toHaveBeenCalled();
  });

  test('does not close the menu if the user clicks outside while drawing an area', async () => {
    store.view.mapLocationSelection.isPickingLocation = true;

    render(<>
      <div data-testid="outside" />

      <Provider store={mockStore(store)}>
        <MapDrawingToolsContextProvider>
          <MenuPopover
            className="className"
            event={event}
            id="areaPicker"
            onBlur={onBlur}
            onChange={onChange}
            onClose={onClose}
            onPickArea={onPickArea}
            setAreaButtonRef={{
              current: {
                contains: () => false,
                focus: setAreaButtonRefFocus,
              },
            }}
            style={{}}
            target={{
              current: {
                contains: () => false,
                offsetWidth: 320,
              },
            }}
          />
        </MapDrawingToolsContextProvider>
      </Provider>
    </>);

    await userEvent.click(screen.getByTestId('outside'));

    expect(onClose).not.toHaveBeenCalled();
    expect(onBlur).not.toHaveBeenCalled();
  });
});
