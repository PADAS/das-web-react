import React from 'react';
import ReactDOM from 'react-dom';
import ReactDOMServer from 'react-dom/server';
import { Provider } from 'react-redux';
import { store } from '../';

import { calcIconColorByPriority } from '../utils/event-types';
import EventIcon from '../EventIcon';

// Returns HTML of given shadow DOM.
const extractUseSvg = (svgUse) => {
  console.log({ svgUse })
}

export const createTheDamnThing = (report) => {
  const container = document.createElement('div');
  const image = document.createElement('img');

  const callbackRef = (instance) => {
    console.log({ instance });
    const svgEl = instance.querySelector('svg use');

    extractUseSvg(svgEl);
    
    /*     var xml = (new XMLSerializer()).serializeToString(svgEl);
    image.src = `data:image/svg+xml;charset=utf-8,${xml}`;

    console.log({ svgImage: image });
    document.querySelector('.App').appendChild(image); */
  };

  const color = calcIconColorByPriority(report.priority);

  const neato = ReactDOM.render( /* eslint-disable-line */
    <div ref={callbackRef}>
      <Provider store={store}>
        <EventIcon report={report} color={color} />
      </Provider>
    </div>, container);

};