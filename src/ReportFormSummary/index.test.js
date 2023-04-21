import React from 'react';
import { render, screen } from '@testing-library/react';
import ReportFormSummary from './index';
import { report as mockedReport } from '../__test-helpers/fixtures/reports';
import { eventSchemas } from '../__test-helpers/fixtures/event-schemas';
import { Provider } from 'react-redux';
import { mockStore } from '../__test-helpers/MockStore';
import { eventTypes } from '../__test-helpers/fixtures/event-types';
import { eventTypeTitleForEvent } from '../utils/events';


describe('ReportFormSummary', () => {

  const { schema, uiSchema } = eventSchemas.wildlife_sighting_rep['a78576a5-3c5b-40df-b374-12db53fbfdd6'];
  const event_details = {
    wildlifesightingrep_species: 'cheetah',
    wildlifesightingrep_numberanimals: 2,
    wildlifesightingrep_collared: 'yes',
  };
  const reported_by = { name: 'Ranger' };
  const report = { ...mockedReport, event_details, reported_by };
  const initialProps = { report, schema, uiSchema };
  const store = mockStore({
    data: { eventTypes }
  });

  const renderReportFormSummary = (props = initialProps) => render(
    <Provider store={store}>
      <ReportFormSummary {...props} />
    </Provider>
  );

  test('render given summary form', async () => {
    renderReportFormSummary();
    const reportTitle = eventTypeTitleForEvent(report, eventTypes);

    expect( screen.getByText(reportTitle) ).toBeInTheDocument();
    expect( screen.getByText(reported_by.name) ).toBeInTheDocument();

    const numberAnimalsInput = screen.getByRole('spinbutton');
    expect( numberAnimalsInput ).toHaveValue(event_details.wildlifesightingrep_numberanimals);
    expect( numberAnimalsInput ).toHaveAttribute('disabled');

    const species = screen.getByRole('combobox', { name: 'Species' } );
    expect( species ).toHaveValue('2');// cheetah
    expect( species ).toHaveAttribute('disabled');

    const animals = screen.getByRole('combobox', { name: 'Are Animals Collared' } );
    expect( animals ).toHaveValue('0'); // yes
    expect( animals ).toHaveAttribute('disabled');
  });

  test('Hide blank fields of a report summary', async () => {
    const roleOptions = { name: 'Species' };
    const { rerender } = renderReportFormSummary();
    expect( screen.queryByRole('combobox', roleOptions ) ).toBeInTheDocument();

    const eventDetails = { ...event_details };
    delete eventDetails.wildlifesightingrep_species;

    const props = {
      ...initialProps,
      report: {
        ...report,
        event_details: eventDetails
      }
    };

    rerender(<Provider store={store}>
      <ReportFormSummary {...props} />
    </Provider>);

    expect( screen.queryByRole('combobox', roleOptions ) ).not.toBeInTheDocument();
  });


});

