import React, { useEffect } from 'react';
import { SidebarScrollContext, SidebarScrollProvider } from './index';
import { renderHook } from '@testing-library/react-hooks';
import { useContext } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('SidebarScrollContext', () => {

  it('renders empty scrollPositionValues', () => {
    const wrapper = ({ children }) => <SidebarScrollProvider>{children}</SidebarScrollProvider>;
    const { result: { current: { scrollPositionValues } } } = renderHook( () => useContext(SidebarScrollContext), { wrapper });
    expect(scrollPositionValues).toEqual({});
  });

  it('sets scroll position correctly', () => {
    const tab = 'newTab', scrollPosition = 100;
    const wrapper = ({ children }) => <SidebarScrollProvider>{children}</SidebarScrollProvider>;
    const { result } = renderHook( () => useContext(SidebarScrollContext), { wrapper });
    const { current: { setScrollPosition } } = result;
    setScrollPosition(tab, scrollPosition);

    expect(result.current.scrollPositionValues).toEqual({ [tab]: scrollPosition });
  });

  it('scrolls to last saved position', async () => {
    const tab = 'reports', position = 100;
    const onScrollMock = jest.fn();
    HTMLDivElement.prototype.scrollTo = onScrollMock;

    const TestComponent = ({ tab, position }) => {
      const { scrollRef, setScrollPosition, scrollToLastPosition } = useContext(SidebarScrollContext);

      useEffect(() => {
        setScrollPosition(tab, position);
      }, []);

      return <div ref={scrollRef}>
        <p>A cool component</p>
        <button onClick={() => scrollToLastPosition(tab)}>Scroll to last position</button>
      </div>;
    };

    render(
      <SidebarScrollProvider>
        <TestComponent tab={tab} position={position} />
      </SidebarScrollProvider>
    );

    const button = screen.getByRole('button');
    await userEvent.click(button);

    expect(onScrollMock).toHaveBeenCalled();
    expect(onScrollMock).toHaveBeenCalledWith({ top: position });
  });

});