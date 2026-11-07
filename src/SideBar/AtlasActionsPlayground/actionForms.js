import { TAB_KEYS } from '../../constants';

import CheckList from './CheckList';
import DraftEventFields from './DraftEventFields';

import * as styles from './styles.module.scss';

const DAY_MILLISECONDS = 24 * 60 * 60 * 1000;

// datetime-local wants local time without a zone.
const toLocalInputValue = (date) => new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  .toISOString()
  .slice(0, 16);

const enumOptions = (spec, property) => spec.inputSchema.properties[property].items.enum
  .map((value) => ({ id: value, label: value.charAt(0).toUpperCase() + value.slice(1) }));

// Leaves out lists nobody picked from and text nobody typed, so the file
// carries only what the user chose.
const withoutEmpty = (args) => Object.fromEntries(Object.entries(args).filter(([, value]) => (
  Array.isArray(value) ? value.length > 0 : value !== '' && value !== false && value !== undefined
)));

const SingleSelect = ({ label, onChange, recent, t, value }) => <label className={styles.field}>
  <span className={styles.label}>{label}</span>
  {recent.isLoading && <span className={styles.empty}>{t('loading')}</span>}
  {recent.error && <span className={styles.error}>{t('loadError')}</span>}
  {!recent.isLoading && !recent.error && (recent.options.length
    ? <select className={styles.select} onChange={(event) => onChange(event.target.value)} value={value}>
      {recent.options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
    </select>
    : <span className={styles.empty}>{t('noOptions')}</span>)}
</label>;

const TextField = ({ label, onChange, value }) => <label className={styles.field}>
  <span className={styles.label}>{label}</span>
  <input className={styles.input} onChange={(event) => onChange(event.target.value)} type="text" value={value} />
</label>;

const Checkbox = ({ checked, label, onChange }) => <label className={styles.option}>
  <input checked={checked} onChange={(event) => onChange(event.target.checked)} type="checkbox" />
  <span>{label}</span>
</label>;

// Per action: the pickers, how picks become the file's arguments, and the
// view that shows what the action did.
const ACTION_FORMS = {
  show_event: {
    initialPicks: () => ({ event_id: '' }),
    render: ({ options, picks, setPick, t }) => <SingleSelect
      label={t('fields.event')}
      onChange={(id) => setPick('event_id', id)}
      recent={options.events}
      t={t}
      value={picks.event_id || options.events.options[0]?.id || ''}
    />,
    toArguments: (picks, options) => ({ event_id: picks.event_id || options.events.options[0]?.id || '' }),
    destination: (args) => ({ labelKey: 'destinations.event', to: `/${TAB_KEYS.EVENTS}/${args.event_id}` }),
  },

  show_patrol: {
    initialPicks: () => ({ patrol_id: '' }),
    render: ({ options, picks, setPick, t }) => <SingleSelect
      label={t('fields.patrol')}
      onChange={(id) => setPick('patrol_id', id)}
      recent={options.patrols}
      t={t}
      value={picks.patrol_id || options.patrols.options[0]?.id || ''}
    />,
    toArguments: (picks, options) => ({ patrol_id: picks.patrol_id || options.patrols.options[0]?.id || '' }),
    destination: (args) => ({ labelKey: 'destinations.patrol', to: `/${TAB_KEYS.PATROLS}/${args.patrol_id}` }),
  },

  set_event_filter: {
    initialPicks: () => ({ event_type_ids: [], priorities: ['red'], reset: false, states: [], text: '' }),
    render: ({ options, picks, setPick, spec, t }) => <>
      <TextField label={t('fields.text')} onChange={(text) => setPick('text', text)} value={picks.text} />
      <CheckList label={t('fields.states')} onChange={(value) => setPick('states', value)} options={enumOptions(spec, 'states')} value={picks.states} />
      <CheckList label={t('fields.priorities')} onChange={(value) => setPick('priorities', value)} options={enumOptions(spec, 'priorities')} value={picks.priorities} />
      <CheckList label={t('fields.eventTypes')} onChange={(value) => setPick('event_type_ids', value)} options={options.eventTypes} value={picks.event_type_ids} />
      <Checkbox checked={picks.reset} label={t('fields.reset')} onChange={(checked) => setPick('reset', checked)} />
    </>,
    toArguments: (picks) => withoutEmpty(picks),
    destination: () => ({ labelKey: 'destinations.eventFilters', state: { openPopover: 'filters' }, to: `/${TAB_KEYS.EVENTS}` }),
  },

  set_patrol_filter: {
    initialPicks: () => ({ patrol_type_ids: [], reset: false, statuses: ['active'], text: '' }),
    render: ({ options, picks, setPick, spec, t }) => <>
      <TextField label={t('fields.text')} onChange={(text) => setPick('text', text)} value={picks.text} />
      <CheckList label={t('fields.statuses')} onChange={(value) => setPick('statuses', value)} options={enumOptions(spec, 'statuses')} value={picks.statuses} />
      <CheckList label={t('fields.patrolTypes')} onChange={(value) => setPick('patrol_type_ids', value)} options={options.patrolTypes} value={picks.patrol_type_ids} />
      <Checkbox checked={picks.reset} label={t('fields.reset')} onChange={(checked) => setPick('reset', checked)} />
    </>,
    toArguments: (picks) => withoutEmpty(picks),
    destination: () => ({ labelKey: 'destinations.patrolFilters', state: { openPopover: 'filters' }, to: `/${TAB_KEYS.PATROLS}` }),
  },

  set_date_range: {
    initialPicks: () => ({
      lower: toLocalInputValue(new Date(Date.now() - 7 * DAY_MILLISECONDS)),
      reset: false,
      upper: toLocalInputValue(new Date()),
      upToNow: true,
    }),
    render: ({ picks, setPick, t }) => <>
      <label className={styles.field}>
        <span className={styles.label}>{t('fields.lower')}</span>
        <input className={styles.input} disabled={picks.reset} onChange={(event) => setPick('lower', event.target.value)} type="datetime-local" value={picks.lower} />
      </label>
      <label className={styles.field}>
        <span className={styles.label}>{t('fields.upper')}</span>
        <input className={styles.input} disabled={picks.reset || picks.upToNow} onChange={(event) => setPick('upper', event.target.value)} type="datetime-local" value={picks.upper} />
      </label>
      <Checkbox checked={picks.upToNow} label={t('fields.upToNow')} onChange={(checked) => setPick('upToNow', checked)} />
      <Checkbox checked={picks.reset} label={t('fields.resetDates')} onChange={(checked) => setPick('reset', checked)} />
    </>,
    toArguments: (picks) => (picks.reset
      ? { reset: true }
      : { lower: new Date(picks.lower).toISOString(), upper: picks.upToNow ? null : new Date(picks.upper).toISOString() }),
    destination: () => ({ labelKey: 'destinations.dates', state: { openPopover: 'dates' }, to: `/${TAB_KEYS.EVENTS}` }),
  },

  set_map_layer_visibility: {
    initialPicks: () => ({
      analyzer_ids: [],
      events_layer: false,
      feature_set_ids: [],
      subject_group_ids: [],
      subject_ids: [],
      visible: false,
    }),
    render: ({ options, picks, setPick, t }) => <>
      <fieldset className={styles.checkList}>
        <legend className={styles.label}>{t('fields.visibility')}</legend>
        <div className={styles.radios}>
          <label className={styles.option}>
            <input checked={picks.visible} onChange={() => setPick('visible', true)} type="radio" />
            <span>{t('fields.show')}</span>
          </label>
          <label className={styles.option}>
            <input checked={!picks.visible} onChange={() => setPick('visible', false)} type="radio" />
            <span>{t('fields.hide')}</span>
          </label>
        </div>
      </fieldset>
      <CheckList label={t('fields.subjectGroups')} onChange={(value) => setPick('subject_group_ids', value)} options={options.subjectGroups} value={picks.subject_group_ids} />
      <CheckList label={t('fields.subjects')} onChange={(value) => setPick('subject_ids', value)} options={options.subjects} value={picks.subject_ids} />
      <CheckList label={t('fields.featureSets')} onChange={(value) => setPick('feature_set_ids', value)} options={options.featureSets} value={picks.feature_set_ids} />
      <CheckList label={t('fields.analyzers')} onChange={(value) => setPick('analyzer_ids', value)} options={options.analyzers} value={picks.analyzer_ids} />
      <Checkbox checked={picks.events_layer} label={t('fields.eventsLayer')} onChange={(checked) => setPick('events_layer', checked)} />
    </>,
    toArguments: (picks) => ({ ...withoutEmpty(picks), visible: picks.visible }),
    destination: () => ({ labelKey: 'destinations.mapLayers', to: `/${TAB_KEYS.LAYERS}` }),
  },

  describe_event_type: {
    initialPicks: () => ({ event_type_id: '' }),
    render: ({ options, picks, setPick, t }) => <SingleSelect
      label={t('fields.eventType')}
      onChange={(id) => setPick('event_type_id', id)}
      recent={options.v2EventTypes}
      t={t}
      value={picks.event_type_id || options.v2EventTypes.options[0]?.id || ''}
    />,
    toArguments: (picks, options) => ({ event_type_id: picks.event_type_id || options.v2EventTypes.options[0]?.id || '' }),
    destination: () => null,
  },

  // The tool opens the form itself, as it does when Atlas calls it.
  draft_new_event: {
    // Kept per event type, since each type has its own fields.
    initialPicks: () => ({ detailsByType: {}, event_type_id: '' }),
    render: ({ options, picks, setPick, t }) => {
      const eventTypeId = picks.event_type_id || options.v2EventTypes.options[0]?.id || '';

      return <>
        <SingleSelect
          label={t('fields.eventType')}
          onChange={(id) => setPick('event_type_id', id)}
          recent={options.v2EventTypes}
          t={t}
          value={eventTypeId}
        />
        <DraftEventFields
          eventDetails={picks.detailsByType[eventTypeId] ?? {}}
          eventTypeId={eventTypeId}
          onChange={(eventDetails) => setPick('detailsByType', { ...picks.detailsByType, [eventTypeId]: eventDetails })}
          t={t}
        />
      </>;
    },
    toArguments: (picks, options) => {
      const eventTypeId = picks.event_type_id || options.v2EventTypes.options[0]?.id || '';

      return { event_type_id: eventTypeId, event_details: picks.detailsByType[eventTypeId] ?? {} };
    },
    destination: () => null,
  },

  pin_subject_tracks: {
    initialPicks: () => ({ subject_group_ids: [], subject_ids: [] }),
    render: ({ options, picks, setPick, t }) => <>
      <CheckList label={t('fields.subjects')} onChange={(value) => setPick('subject_ids', value)} options={options.trackableSubjects} value={picks.subject_ids} />
      <CheckList label={t('fields.subjectGroups')} onChange={(value) => setPick('subject_group_ids', value)} options={options.subjectGroups} value={picks.subject_group_ids} />
    </>,
    toArguments: (picks) => withoutEmpty(picks),
    destination: () => ({ labelKey: 'destinations.map', to: '/' }),
  },
};

export default ACTION_FORMS;
