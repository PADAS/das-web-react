import React, { useRef, useState } from 'react';
import userEvent from '@testing-library/user-event';

import { render, screen } from '../../../../../../test-utils';

import useModalPopover from './';

describe('SideBar - PatrolsManager - PatrolsFeed - Filters - utils - useModalPopover', () => {
  let onClose;

  beforeEach(() => {
    onClose = jest.fn();
  });

  const ModalPopover = ({ children, isNestedMenuOpen, trigger }) => {
    const bodyRef = useRef(null);

    const { focusPopover, onKeyDown } = useModalPopover(bodyRef, trigger, onClose, isNestedMenuOpen);

    return <div aria-label="Popover" onKeyDown={onKeyDown} role="dialog" tabIndex={-1}>
      <div ref={bodyRef}>
        <button onClick={focusPopover} type="button">First</button>

        <button disabled type="button">Disabled</button>

        <button type="button">Last</button>

        {children}
      </div>
    </div>;
  };

  const ModalPopoverWithTrigger = ({ children = null, isNestedMenuOpen = false }) => {
    const [trigger, setTrigger] = useState(null);

    return <>
      <button ref={setTrigger} type="button">Trigger</button>

      <button type="button">Outside</button>

      {!!trigger && <ModalPopover isNestedMenuOpen={isNestedMenuOpen} trigger={trigger}>{children}</ModalPopover>}
    </>;
  };

  const RemovedOnClickButton = () => {
    const [isShown, setIsShown] = useState(true);

    return isShown && <button onClick={() => setIsShown(false)} type="button">Removed on click</button>;
  };

  const renderModalPopover = (props) => render(<ModalPopoverWithTrigger {...props} />);

  test('focuses the popover itself when it mounts', () => {
    renderModalPopover();

    expect(screen.getByRole('dialog')).toHaveFocus();
  });

  test('focuses the popover itself when its focus function is called', async () => {
    renderModalPopover();

    await userEvent.click(screen.getByRole('button', { name: 'First' }));

    expect(screen.getByRole('dialog')).toHaveFocus();
  });

  test('moves focus from the last element back to the first when the user tabs past it', async () => {
    renderModalPopover();

    screen.getByRole('button', { name: 'Last' }).focus();

    await userEvent.tab();

    expect(screen.getByRole('button', { name: 'First' })).toHaveFocus();
  });

  test('moves focus from the first element to the last when the user tabs backwards past it', async () => {
    renderModalPopover();

    screen.getByRole('button', { name: 'First' }).focus();

    await userEvent.tab({ shift: true });

    expect(screen.getByRole('button', { name: 'Last' })).toHaveFocus();
  });

  test('moves focus back to the first element when the user tabs past the checked radio of a closing group', async () => {
    renderModalPopover({
      children: <>
        <input aria-label="Checked" defaultChecked name="mode" type="radio" />

        <input aria-label="Unchecked" name="mode" type="radio" />
      </>,
    });

    screen.getByRole('radio', { name: 'Checked' }).focus();

    await userEvent.tab();

    expect(screen.getByRole('button', { name: 'First' })).toHaveFocus();
  });

  test('moves focus back to the first element when the user tabs past a closing group with no radio checked', async () => {
    renderModalPopover({
      children: <>
        <input aria-label="First radio" name="mode" type="radio" />

        <input aria-label="Second radio" name="mode" type="radio" />
      </>,
    });

    screen.getByRole('radio', { name: 'First radio' }).focus();

    await userEvent.tab();

    expect(screen.getByRole('button', { name: 'First' })).toHaveFocus();
  });

  test('skips elements taken out of the tab order when the user tabs backwards past the first', async () => {
    renderModalPopover({ children: <button tabIndex={-1} type="button">Untabbable</button> });

    screen.getByRole('button', { name: 'First' }).focus();

    await userEvent.tab({ shift: true });

    expect(screen.getByRole('button', { name: 'Last' })).toHaveFocus();
  });

  test('skips disabled elements when the user tabs', async () => {
    renderModalPopover();

    screen.getByRole('button', { name: 'First' }).focus();

    await userEvent.tab();

    expect(screen.getByRole('button', { name: 'Last' })).toHaveFocus();
  });

  test('brings focus resting on the popover itself to its first element when the user tabs', async () => {
    renderModalPopover();

    await userEvent.tab();

    expect(screen.getByRole('button', { name: 'First' })).toHaveFocus();
  });

  test('brings focus resting on the popover itself to its last element when the user tabs backwards', async () => {
    renderModalPopover();

    await userEvent.tab({ shift: true });

    expect(screen.getByRole('button', { name: 'Last' })).toHaveFocus();
  });

  test('closes and returns focus to the trigger when the user presses escape', async () => {
    renderModalPopover();

    await userEvent.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Trigger' })).toHaveFocus();
  });

  test('stays open when the user presses escape while a nested menu is open', async () => {
    renderModalPopover({ isNestedMenuOpen: true });

    await userEvent.keyboard('{Escape}');

    expect(onClose).not.toHaveBeenCalled();
  });

  test('closes when the user clicks outside it', async () => {
    renderModalPopover();

    await userEvent.click(screen.getByRole('button', { name: 'Outside' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('stays open when the user right clicks outside it', async () => {
    renderModalPopover();

    await userEvent.pointer({ keys: '[MouseRight]', target: screen.getByRole('button', { name: 'Outside' }) });

    expect(onClose).not.toHaveBeenCalled();
  });

  test('stays open when the user clicks outside it while holding a modifier key', async () => {
    const user = userEvent.setup();

    renderModalPopover();

    await user.keyboard('{Meta>}');
    await user.click(screen.getByRole('button', { name: 'Outside' }));

    expect(onClose).not.toHaveBeenCalled();
  });

  test('stays open when a press the user starts inside it ends outside it', async () => {
    renderModalPopover();

    await userEvent.pointer([
      { keys: '[MouseLeft>]', target: screen.getByRole('button', { name: 'Last' }) },
      { target: screen.getByRole('button', { name: 'Outside' }) },
      { keys: '[/MouseLeft]', target: screen.getByRole('button', { name: 'Outside' }) },
    ]);

    expect(onClose).not.toHaveBeenCalled();
  });

  test('stays open when a click inside it removes its target', async () => {
    renderModalPopover({ children: <RemovedOnClickButton /> });

    await userEvent.click(screen.getByRole('button', { name: 'Removed on click' }));

    expect(onClose).not.toHaveBeenCalled();
  });

  test('leaves a click on the trigger to the trigger', async () => {
    renderModalPopover();

    await userEvent.click(screen.getByRole('button', { name: 'Trigger' }));

    expect(onClose).not.toHaveBeenCalled();
  });

  test('stays open when the user clicks inside it', async () => {
    renderModalPopover();

    await userEvent.click(screen.getByRole('button', { name: 'Last' }));

    expect(onClose).not.toHaveBeenCalled();
  });
});
