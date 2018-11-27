import React from 'react';
import EventFeed from '../EventFeed';
import './SideBar.css';

const SideBar = (props) => {
  return (
    <aside className="side-menu">
      <EventFeed events={props.events.results} />
    </aside>
  )
}

export default SideBar;