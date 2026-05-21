import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate as useReactNavigate, useParams, useSearchParams } from 'react-router';
import Modal from 'react-bootstrap/Modal';
import ExpandLessOutlinedIcon from '@mui/icons-material/ExpandLessOutlined';
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';

import { ReactComponent as CrossIcon } from '../common/images/icons/cross.svg';
import { ReactComponent as ChevronRightIcon } from '../common/images/icons/chevron-right.svg';
import { ReactComponent as PatrolIcon } from '../common/images/icons/patrol.svg';

import Select from '../Select';
import LocationPicker from '../LocationPicker';
import useNavigate from '../hooks/useNavigate';
import { TAB_KEYS } from '../constants';
import { addLeg, getLegForm, getLegs, initLegs, updateLeg } from '../PatrolOverview/legsStore';
import { addUserPatrol } from '../PatrolList/userPatrolsStore';
import EditableTitle from '../EditableTitle';

import * as styles from './styles.module.scss';

// Team rosters — each team has different members with varied roles.
// Some names appear on multiple teams (e.g., Maya Chen on Delta & Echo).
// `tracked: true` means the member carries a phone (or other tracker) and
// produces position observations while a patrol is active. Members without
// `tracked` set won't show pin / track buttons in the tracking UI.
const TEAM_ROSTERS = {
  Alpha: [
    { id: 'alpha-1', name: 'Priya Sharma', role: 'Patrol Lead', tracked: true },
    { id: 'alpha-2', name: 'Jordan Reeves', role: 'Driver', tracked: true },
    { id: 'alpha-3', name: 'Tomas Vega', role: 'Ranger' },
    { id: 'alpha-4', name: 'Hana Okafor', role: 'Ranger' },
    { id: 'alpha-5', name: 'Sam Liu', role: 'Ranger', tracked: true },
  ],
  Bravo: [
    { id: 'bravo-1', name: 'Lukas Becker', role: 'Patrol Lead', tracked: true },
    { id: 'bravo-2', name: 'Naledi Khumalo', role: 'Pilot', tracked: true },
    { id: 'bravo-3', name: 'Hana Okafor', role: 'Ranger' },
    { id: 'bravo-4', name: 'Carter Mwangi', role: 'Ranger' },
  ],
  Charlie: [
    { id: 'charlie-1', name: 'Priya Sharma', role: 'Patrol Lead', tracked: true },
    { id: 'charlie-2', name: 'Imani Ndlovu', role: 'Ranger' },
    { id: 'charlie-3', name: 'Wei Zhang', role: 'Ranger', tracked: true },
  ],
  Delta: [
    { id: 'delta-1', name: 'Maya Chen', role: 'Patrol Lead', tracked: true },
    { id: 'delta-2', name: 'Jordan Reeves', role: 'Driver', tracked: true },
    { id: 'delta-3', name: 'Leo Nakamura', role: 'Ranger' },
    { id: 'delta-4', name: 'Amara Osei', role: 'Ranger' },
  ],
  Echo: [
    { id: 'echo-1', name: 'Maya Chen', role: 'Patrol Lead', tracked: true },
    { id: 'echo-2', name: 'Naledi Khumalo', role: 'Pilot', tracked: true },
    { id: 'echo-3', name: 'Eli Rosenberg', role: 'Driver', tracked: true },
    { id: 'echo-4', name: 'Sam Liu', role: 'Ranger' },
    { id: 'echo-5', name: 'Carter Mwangi', role: 'Ranger' },
    { id: 'echo-6', name: 'Imani Ndlovu', role: 'Ranger' },
    { id: 'echo-7', name: 'Wei Zhang', role: 'Ranger' },
  ],
  Gamma: [
    { id: 'gamma-1', name: 'Eli Rosenberg', role: 'Patrol Lead', tracked: true },
    { id: 'gamma-2', name: 'Tomas Vega', role: 'Ranger' },
    { id: 'gamma-3', name: 'Amara Osei', role: 'Ranger' },
  ],
};

const TEAM_NAMES = Object.keys(TEAM_ROSTERS);

const ROLE_OPTIONS = ['Patrol Lead', 'Driver', 'Ranger'];

// All known people across teams (deduplicated by name).
// Each person's default role is the role from the first team they appear on.
const ALL_PEOPLE = (() => {
  const seen = new Map();
  Object.values(TEAM_ROSTERS).forEach((roster) => {
    roster.forEach((m) => {
      if (!seen.has(m.name)) {
        seen.set(m.name, m.role);
      }
    });
  });
  return Array.from(seen.entries()).map(([name, role]) => ({ name, defaultRole: role }));
})();

const ALL_ASSETS = [
  'KTN-123',
  'KTN-456',
  'KTN-789',
  'Long Range Radio',
  'Sat Phone 01',
  'Sat Phone 02',
  'Maya Chen (Garmin)',
  'Jordan Reeves (Garmin)',
  'Priya Sharma (Garmin)',
  'Drone D-01',
  'Drone D-02',
  'Helicopter H-01',
  'Helicopter H-02',
  'Boat B-01',
  'Boat B-02',
];

// Prototype pre-filled patrol used when the user enters "new leg" or "edit existing leg" mode
// (where details from the current leg are copied forward).
const DEFAULT_NEW_LEG_VALUES = {
  startDate: '2026-04-13',
  startTime: '08:00',
  endDate: '',
  endTime: '',
  startLocation: null,
  endLocation: null,
  autoStart: true,
  autoEnd: true,
  trackedBy: 'KTN-123',
  station: 'Station 0',
  title: 'New Patrol',
  objective: 'Get the team to the start of the trail',
  armed: 'Yes',
  team: 'Delta',
  teamMembers: TEAM_ROSTERS.Delta,
  assets: [
    { id: 'a1', name: 'KTN-123' },
    { id: 'a2', name: 'Maya Chen (Garmin)' },
  ],
  patrolType: 'Vehicle Patrol',
  driverName: 'Jordan Reeves',
  vehicleName: 'KTN-123',
};

// Build the "new leg" initial values by copying the previous leg's form data
// (so the same patrol type, team, etc. carry over) but overriding the start
// time/date with NOW. Falls back to DEFAULT_NEW_LEG_VALUES when there's no
// previous leg to copy from.
const buildNewLegInitialValues = (previousLegForm) => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const startDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const startTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  // Strip any internal/derived fields from the previous leg's saved form.
  const { _stats, _events, _createdAt, _endedAt, ...prev } = previousLegForm || {};
  const base = previousLegForm ? prev : DEFAULT_NEW_LEG_VALUES;
  return {
    ...base,
    startDate,
    startTime,
    // End time is open-ended for a brand-new leg
    endDate: '',
    endTime: '',
  };
};

const EMPTY_VALUES = {
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  startLocation: null,
  endLocation: null,
  autoStart: false,
  autoEnd: false,
  trackedBy: '',
  station: '',
  title: 'New Patrol',
  objective: '',
  armed: '',
  team: '',
  teamMembers: [],
  assets: [],
  patrolType: 'Vehicle Patrol',
  // Vehicle Patrol
  driverName: '',
  vehicleName: '',
  // Foot Patrol
  gear: '',
  rations: [],
  route: '',
  // Aerial Patrol
  fuel: '',
  aircraft: '',
  pilotName: '',
  altitude: '',
  // Routine Patrol
  frequency: '',
  checkpoints: '',
};

const PATROL_TYPES = ['Vehicle Patrol', 'Foot Patrol', 'Aerial Patrol', 'Routine Patrol'];

const GEAR_OPTIONS = ['Hiking Pack', 'Camping Set', 'Quick Response Kit', 'Ranger Standard Kit'];
const RATIONS_OPTIONS = ['Energy Bars', 'MREs', 'Water Bottles', 'Trail Mix', 'Dehydrated Meals', 'Electrolyte Tablets'];
const AIRCRAFT_OPTIONS = ['Cessna 172', 'Robinson R44', 'Bell 206', 'Drone DJI Matrice'];
const FREQUENCY_OPTIONS = ['Daily', 'Weekly', 'Monthly', 'Bi-weekly'];

const TextField = ({ label, value, onChange, placeholder = '', type = 'text' }) => <label className={styles.field}>
  {label && <span className={styles.fieldLabel}>{label}</span>}
  <input
    className={styles.standaloneInput}
    type={type}
    value={value}
    placeholder={placeholder}
    onChange={(e) => onChange(e.target.value)}
  />
</label>;

const SelectField = ({ label, value, onChange, options }) => {
  const selectOptions = options.map((o) => ({ value: o, label: o }));
  const selected = selectOptions.find((o) => o.value === value) || null;

  return <label className={styles.field}>
    {label && <span className={styles.fieldLabel}>{label}</span>}
    <Select
      value={selected}
      onChange={(opt) => onChange(opt?.value ?? '')}
      options={selectOptions}
      isClearable={false}
      isSearchable={false}
    />
  </label>;
};

const MultiSelectField = ({ label, values = [], onChange, options }) => {
  const selectOptions = options.map((o) => ({ value: o, label: o }));
  const selected = selectOptions.filter((o) => values.includes(o.value));

  return <label className={styles.field}>
    {label && <span className={styles.fieldLabel}>{label}</span>}
    <Select
      value={selected}
      onChange={(opts) => onChange((opts || []).map((o) => o.value))}
      options={selectOptions}
      isMulti
      isClearable={false}
      isSearchable
    />
  </label>;
};

const NumericField = ({ label, value, onChange, unit = '', placeholder = '' }) => <label className={styles.field}>
  {label && <span className={styles.fieldLabel}>{label}{unit ? ` (${unit})` : ''}</span>}
  <input
    className={styles.standaloneInput}
    type="number"
    inputMode="decimal"
    value={value}
    placeholder={placeholder}
    onChange={(e) => onChange(e.target.value)}
  />
</label>;

const DateTimePair = ({ dateLabel, dateValue, onDateChange, timeValue, onTimeChange }) => <div className={styles.dateTimeRow}>
  <TextField label={dateLabel} value={dateValue} onChange={onDateChange} placeholder="yyyy/mm/dd" type="date" />
  <TextField label="" value={timeValue} onChange={onTimeChange} placeholder="--:-- AM" type="time" />
</div>;

const LocationField = ({ value, onChange, id }) => <div className={styles.locationWrap}>
  <LocationPicker
    id={id}
    onChange={onChange}
    placeholder="Set Location"
    value={value}
  />
</div>;

const AutoCheckbox = ({ label, checked, onChange }) => <label className={styles.checkbox}>
  <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
  <span>{label}</span>
</label>;

const AddTeamMemberModal = ({ show, index, existingNames, initial, onCancel, onDone }) => {
  const [memberName, setMemberName] = useState('');
  const [memberRole, setMemberRole] = useState('');

  const isEdit = !!initial;

  // Reset / seed draft whenever the modal opens
  React.useEffect(() => {
    if (show) {
      setMemberName(initial?.name ?? '');
      setMemberRole(initial?.role ?? '');
    }
  }, [show, initial]);

  const availableOptions = useMemo(() => ALL_PEOPLE
    .filter((p) => !existingNames.includes(p.name) || p.name === initial?.name)
    .map((p) => ({ value: p.name, label: p.name, defaultRole: p.defaultRole })),
  [existingNames, initial]);

  const roleOptions = ROLE_OPTIONS.map((r) => ({ value: r, label: r }));
  const selectedName = availableOptions.find((o) => o.value === memberName) || null;
  const selectedRole = roleOptions.find((o) => o.value === memberRole) || null;

  const onNameChange = (opt) => {
    setMemberName(opt?.value ?? '');
    // Auto-populate role if the person's default role is one of the dropdown options
    const def = opt?.defaultRole;
    if (def && ROLE_OPTIONS.includes(def)) {
      setMemberRole(def);
    }
  };

  return <Modal show={show} onHide={onCancel} centered dialogClassName={styles.memberModal}>
    <Modal.Body className={styles.memberModalBody}>
      <div className={styles.memberModalEyebrow}>Team member {index + 1}</div>
      <h2 className={styles.memberModalTitle}>{isEdit ? 'Edit team member' : 'Team member'}</h2>

      <div className={styles.memberModalField}>
        <span className={styles.fieldLabel}>Team Member</span>
        <Select
          value={selectedName}
          onChange={onNameChange}
          options={availableOptions}
          isClearable
          isSearchable
        />
      </div>

      <div className={styles.memberModalField}>
        <span className={styles.fieldLabel}>Role</span>
        <Select
          value={selectedRole}
          onChange={(opt) => setMemberRole(opt?.value ?? '')}
          options={roleOptions}
          isClearable={false}
          isSearchable={false}
        />
      </div>
    </Modal.Body>
    <Modal.Footer className={styles.memberModalFooter}>
      <button type="button" className={styles.cancelButton} onClick={onCancel}>Cancel</button>
      <button
        type="button"
        className={styles.primaryButton}
        disabled={!memberName}
        onClick={() => onDone({ name: memberName, role: memberRole })}
      >
        Done
      </button>
    </Modal.Footer>
  </Modal>;
};

const AddAssetModal = ({ show, index, existingNames, initial, onCancel, onDone }) => {
  const [assetName, setAssetName] = useState('');

  const isEdit = !!initial;

  React.useEffect(() => {
    if (show) setAssetName(initial?.name ?? '');
  }, [show, initial]);

  const availableOptions = useMemo(() => ALL_ASSETS
    .filter((a) => !existingNames.includes(a) || a === initial?.name)
    .map((a) => ({ value: a, label: a })),
  [existingNames, initial]);

  const selected = availableOptions.find((o) => o.value === assetName) || null;

  return <Modal show={show} onHide={onCancel} centered dialogClassName={styles.memberModal}>
    <Modal.Body className={styles.memberModalBody}>
      <div className={styles.memberModalEyebrow}>Asset {index + 1}</div>
      <h2 className={styles.memberModalTitle}>{isEdit ? 'Edit asset' : 'Asset'}</h2>

      <div className={styles.memberModalField}>
        <span className={styles.fieldLabel}>Asset</span>
        <Select
          value={selected}
          onChange={(opt) => setAssetName(opt?.value ?? '')}
          options={availableOptions}
          isClearable
          isSearchable
        />
      </div>
    </Modal.Body>
    <Modal.Footer className={styles.memberModalFooter}>
      <button type="button" className={styles.cancelButton} onClick={onCancel}>Cancel</button>
      <button
        type="button"
        className={styles.primaryButton}
        disabled={!assetName}
        onClick={() => onDone({ name: assetName })}
      >
        Done
      </button>
    </Modal.Footer>
  </Modal>;
};

const CollectionItem = ({ name, role, onDelete, onEdit, showRole }) => <div className={styles.collectionItem}>
  <span className={styles.collectionName}>{name}</span>
  {showRole
    ? <span className={styles.collectionRoleText}>{role || ''}</span>
    : <span />}
  <div className={styles.collectionItemActions}>
    <button type="button" className={styles.rowIconButton} onClick={onDelete} aria-label="Remove">
      <DeleteIcon />
    </button>
    <button type="button" className={styles.rowIconButton} onClick={onEdit} aria-label="Edit">
      <EditIcon />
    </button>
  </div>
</div>;

const Header = ({ patrolType, title, editableTitle, onChangeTitle, showSubtitle = true }) => <header className={styles.header}>
  <div className={styles.headerTop}>
    <div className={styles.iconBadge}>
      <PatrolIcon />
    </div>
    <div className={styles.titleBlock}>
      {editableTitle
        ? <EditableTitle value={title} onChange={onChangeTitle} placeholder="New Patrol" />
        : <h2 className={styles.title}>{title}</h2>}
      {showSubtitle && <div className={styles.subtitleRow}>
        <span>{patrolType || 'Patrol'}</span>
      </div>}
    </div>
  </div>
</header>;

const Breadcrumb = ({ onClose, currentLabel = 'New Patrol' }) => <nav className={styles.breadcrumb} aria-label="Breadcrumb">
  <ol>
    <li>
      <Link to={`/${TAB_KEYS.PATROLS}`}>Patrols</Link>
      <ChevronRightIcon width={10} height={10} />
    </li>
    <li className={styles.current}>{currentLabel}</li>
  </ol>
  <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close">
    <CrossIcon />
  </button>
</nav>;

const PatrolForm = () => {
  const navigate = useNavigate();
  const reactNavigate = useReactNavigate();
  const location = useLocation();
  const { id: patrolId, legIndex } = useParams();
  const [searchParams] = useSearchParams();

  const isEditLeg = /\/legs\/\d+\/edit$/.test(location.pathname);
  const isNewLeg = searchParams.get('newLeg') === '1' || /\/legs\/new$/.test(location.pathname);
  const requestedPatrolType = searchParams.get('patrolType');

  const initial = useMemo(() => {
    let base;
    if (isNewLeg) {
      // Copy details from the most recent leg (so the same patrol type, team,
      // etc. carry over), but stamp start time to NOW.
      const existingLegs = patrolId ? getLegs(patrolId) : [];
      const lastLeg = existingLegs[existingLegs.length - 1];
      const previousForm = lastLeg
        ? (getLegForm(patrolId, existingLegs.length - 1) || lastLeg._form)
        : null;
      base = buildNewLegInitialValues(previousForm);
    } else if (isEditLeg) {
      // Pull the actual saved leg form from the store; fall back to defaults.
      base = (patrolId && getLegForm(patrolId, legIndex)) || DEFAULT_NEW_LEG_VALUES;
    } else {
      // Brand-new patrol: start at empty values but pre-fill start time to NOW.
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      base = {
        ...EMPTY_VALUES,
        startDate: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
        startTime: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
      };
    }
    if (requestedPatrolType && PATROL_TYPES.includes(requestedPatrolType)) {
      // For a brand-new patrol, default the title to the chosen patrol type
      // (e.g. "Foot Patrol"). The title is still editable.
      const titleOverride = (!isEditLeg && !isNewLeg) ? { title: requestedPatrolType } : {};
      return { ...base, patrolType: requestedPatrolType, ...titleOverride };
    }
    return base;
  }, [isNewLeg, isEditLeg, requestedPatrolType, patrolId, legIndex]);
  const [form, setForm] = useState(initial);

  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(initial),
    [form, initial]
  );

  const focusField = searchParams.get('focus');
  const formRef = useRef(null);

  useEffect(() => {
    if (!focusField || !formRef.current) return;
    const target = formRef.current.querySelector(`[data-field-key="${focusField}"]`);
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Try to focus the first input/select within
    const focusable = target.querySelector('input, select, textarea, button');
    if (focusable) {
      setTimeout(() => focusable.focus(), 300);
    }
    target.classList.add(styles.focusFlash);
    setTimeout(() => target.classList.remove(styles.focusFlash), 1500);
  }, [focusField]);

  const [teamMembersExpanded, setTeamMembersExpanded] = useState(true);
  const [assetsExpanded, setAssetsExpanded] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [editingAssetId, setEditingAssetId] = useState(null);

  const editingMember = form.teamMembers.find((m) => m.id === editingMemberId) || null;
  const editingAsset = form.assets.find((a) => a.id === editingAssetId) || null;

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const onChangeTeam = (teamName) => {
    setForm((prev) => ({
      ...prev,
      team: teamName,
      teamMembers: TEAM_ROSTERS[teamName] ? [...TEAM_ROSTERS[teamName]] : [],
    }));
  };

  const onClose = () => {
    if (isEditLeg && patrolId && legIndex !== undefined) {
      reactNavigate(`/${TAB_KEYS.PATROLS}/${patrolId}/legs/${legIndex}`);
    } else if (patrolId) {
      reactNavigate(`/${TAB_KEYS.PATROLS}/${patrolId}`);
    } else {
      navigate(`/${TAB_KEYS.PATROLS}`);
    }
  };

  const onCancel = onClose;

  const onCreate = () => {
    if (isEditLeg && patrolId && legIndex !== undefined) {
      updateLeg(patrolId, legIndex, form);
    } else if (isNewLeg && patrolId) {
      addLeg(patrolId, form);
    } else if (!isEditLeg && !isNewLeg) {
      // Brand-new patrol — stamp start time to now, seed it with a single leg
      // built from the form values, and surface it in the patrols list.
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const startDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      const startTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
      const created = addUserPatrol({
        title: form.title || form.objective || `${form.patrolType || 'New'} Patrol`,
        patrolType: form.patrolType,
        objective: form.objective,
        startedAt: now,
      });
      initLegs(created.id, [{
        ...form,
        startDate,
        startTime,
        endDate: '',
        endTime: '',
      }]);
      navigate(`/${TAB_KEYS.PATROLS}/${created.id}`);
      return;
    }
    // For prototype, just navigate back. Real flow would POST to API.
    onClose();
  };

  const onAddMemberDone = ({ name, role }) => {
    if (!name) return;
    if (editingMemberId) {
      set('teamMembers', form.teamMembers.map((m) =>
        m.id === editingMemberId ? { ...m, name, role: role || '' } : m
      ));
      setEditingMemberId(null);
    } else {
      set('teamMembers', [
        ...form.teamMembers,
        { id: `m-${Date.now()}`, name, role: role || '' },
      ]);
      setShowAddMember(false);
    }
  };

  const onCancelAddMember = () => {
    setShowAddMember(false);
    setEditingMemberId(null);
  };

  const removeTeamMember = (id) => set('teamMembers', form.teamMembers.filter((m) => m.id !== id));

  const onAddAssetDone = ({ name }) => {
    if (!name) return;
    if (editingAssetId) {
      set('assets', form.assets.map((a) => (a.id === editingAssetId ? { ...a, name } : a)));
      setEditingAssetId(null);
    } else {
      set('assets', [...form.assets, { id: `a-${Date.now()}`, name }]);
      setShowAddAsset(false);
    }
  };

  const onCancelAddAsset = () => {
    setShowAddAsset(false);
    setEditingAssetId(null);
  };

  const removeAsset = (id) => set('assets', form.assets.filter((a) => a.id !== id));

  return <div className={styles.patrolForm} ref={formRef}>
    <Breadcrumb
      onClose={onClose}
      currentLabel={isEditLeg
        ? `Leg ${Number(legIndex) + 1}`
        : isNewLeg ? 'New Patrol Leg' : (form.title || 'New Patrol')}
    />

    <div className={styles.body}>
      <Header
        patrolType={form.patrolType}
        title={isEditLeg
          ? `Leg ${Number(legIndex) + 1}`
          : isNewLeg ? 'New Patrol Leg' : (form.title || form.patrolType || 'New Patrol')}
        editableTitle={!isEditLeg && !isNewLeg}
        onChangeTitle={(v) => set('title', v)}
        // For brand-new patrols the patrol type IS the title, so hide the
        // redundant subtitle. Leg flows still show the leg's type as subtitle.
        showSubtitle={isEditLeg || isNewLeg}
      />

      <section className={styles.section}>
        <div className={styles.startEndRow}>
          <div className={styles.startEndColumn} data-field-key="start">
            <DateTimePair
              dateLabel="Start"
              dateValue={form.startDate}
              onDateChange={(v) => set('startDate', v)}
              timeValue={form.startTime}
              onTimeChange={(v) => set('startTime', v)}
            />
            <LocationField id="patrolForm-startLocation" value={form.startLocation} onChange={(v) => set('startLocation', v)} />
            <AutoCheckbox
              label="Automatically start the patrol at this time."
              checked={form.autoStart}
              onChange={(v) => set('autoStart', v)}
            />
          </div>
          <div className={styles.startEndColumn} data-field-key="end">
            <DateTimePair
              dateLabel="End"
              dateValue={form.endDate}
              onDateChange={(v) => set('endDate', v)}
              timeValue={form.endTime}
              onTimeChange={(v) => set('endTime', v)}
            />
            <LocationField id="patrolForm-endLocation" value={form.endLocation} onChange={(v) => set('endLocation', v)} />
            <AutoCheckbox
              label="Automatically end the patrol at this time."
              checked={form.autoEnd}
              onChange={(v) => set('autoEnd', v)}
            />
          </div>
        </div>

        <div className={styles.fieldGrid}>
          <div data-field-key="objective">
            <TextField label="Objective" value={form.objective} onChange={(v) => set('objective', v)} />
          </div>
          <div data-field-key="station">
            <TextField label="Station" value={form.station} onChange={(v) => set('station', v)} />
          </div>
        </div>

        <div className={styles.fieldGrid}>
          <div data-field-key="armed">
            <SelectField label="Armed" value={form.armed} onChange={(v) => set('armed', v)} options={['Yes', 'No']} />
          </div>
          <div />
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Patrol Type Details</h3>

        <SelectField
          label="Patrol Type"
          value={form.patrolType}
          onChange={(v) => set('patrolType', v)}
          options={PATROL_TYPES}
        />

        {form.patrolType === 'Vehicle Patrol' && <div className={styles.fieldGrid}>
          <div data-field-key="driverName">
            <TextField label="Driver Name" value={form.driverName} onChange={(v) => set('driverName', v)} />
          </div>
          <div data-field-key="vehicleName">
            <TextField label="Vehicle Name" value={form.vehicleName} onChange={(v) => set('vehicleName', v)} />
          </div>
        </div>}

        {form.patrolType === 'Foot Patrol' && <>
          <div className={styles.fieldGrid}>
            <SelectField label="Gear" value={form.gear} onChange={(v) => set('gear', v)} options={GEAR_OPTIONS} />
            <TextField label="Route" value={form.route} onChange={(v) => set('route', v)} />
          </div>
          <MultiSelectField label="Rations" values={form.rations} onChange={(v) => set('rations', v)} options={RATIONS_OPTIONS} />
        </>}

        {form.patrolType === 'Aerial Patrol' && <>
          <div className={styles.fieldGrid}>
            <SelectField label="Aircraft" value={form.aircraft} onChange={(v) => set('aircraft', v)} options={AIRCRAFT_OPTIONS} />
            <TextField label="Pilot Name" value={form.pilotName} onChange={(v) => set('pilotName', v)} />
          </div>
          <div className={styles.fieldGrid}>
            <NumericField label="Fuel" unit="L" value={form.fuel} onChange={(v) => set('fuel', v)} />
            <NumericField label="Altitude" unit="m" value={form.altitude} onChange={(v) => set('altitude', v)} />
          </div>
        </>}

        {form.patrolType === 'Routine Patrol' && <div className={styles.fieldGrid}>
          <SelectField label="Frequency" value={form.frequency} onChange={(v) => set('frequency', v)} options={FREQUENCY_OPTIONS} />
          <NumericField label="Checkpoints" value={form.checkpoints} onChange={(v) => set('checkpoints', v)} />
        </div>}
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Team &amp; Tracking</h3>

        <div data-field-key="team">
          <SelectField label="Team" value={form.team} onChange={onChangeTeam} options={TEAM_NAMES} />
        </div>

        <div className={styles.collectionBlock}>
          <button type="button" className={styles.collectionHeader} onClick={() => setTeamMembersExpanded((v) => !v)}>
            <span>Team Members - {form.teamMembers.length}</span>
            {teamMembersExpanded ? <ExpandLessOutlinedIcon /> : <ExpandMoreOutlinedIcon />}
          </button>
          {teamMembersExpanded && <>
            <div className={styles.collectionColumnHeaders}>
              <span>Team Member</span>
              <span>Role</span>
              <span />
            </div>
            <div className={styles.collectionList}>
              {form.teamMembers.map((m) => <CollectionItem
                key={m.id}
                name={m.name}
                role={m.role}
                showRole
                onDelete={() => removeTeamMember(m.id)}
                onEdit={() => setEditingMemberId(m.id)}
              />)}
            </div>
            <button type="button" className={styles.addItemButton} onClick={() => setShowAddMember(true)}>
              <AddOutlinedIcon /> Team Member
            </button>
          </>}
        </div>

        <div className={styles.collectionBlock}>
          <button type="button" className={styles.collectionHeader} onClick={() => setAssetsExpanded((v) => !v)}>
            <span>Assets - {form.assets.length}</span>
            {assetsExpanded ? <ExpandLessOutlinedIcon /> : <ExpandMoreOutlinedIcon />}
          </button>
          {assetsExpanded && <>
            <div className={styles.collectionList}>
              {form.assets.map((a) => <CollectionItem
                key={a.id}
                name={a.name}
                onDelete={() => removeAsset(a.id)}
                onEdit={() => setEditingAssetId(a.id)}
              />)}
            </div>
            <button type="button" className={styles.addItemButton} onClick={() => setShowAddAsset(true)}>
              <AddOutlinedIcon /> Asset
            </button>
          </>}
        </div>
      </section>
    </div>

    <div className={styles.stickyFooter}>
      <button type="button" className={styles.cancelButton} onClick={onCancel}>Cancel</button>
      <button
        type="button"
        className={styles.primaryButton}
        onClick={onCreate}
        disabled={isEditLeg && !isDirty}
      >
        {isEditLeg ? 'Edit Patrol Leg' : isNewLeg ? 'Create Patrol Leg' : 'Create Patrol'}
      </button>
    </div>

    <AddTeamMemberModal
      show={showAddMember || !!editingMember}
      index={editingMember
        ? form.teamMembers.findIndex((m) => m.id === editingMember.id)
        : form.teamMembers.length}
      existingNames={form.teamMembers.map((m) => m.name)}
      initial={editingMember}
      onCancel={onCancelAddMember}
      onDone={onAddMemberDone}
    />

    <AddAssetModal
      show={showAddAsset || !!editingAsset}
      index={editingAsset
        ? form.assets.findIndex((a) => a.id === editingAsset.id)
        : form.assets.length}
      existingNames={form.assets.map((a) => a.name)}
      initial={editingAsset}
      onCancel={onCancelAddAsset}
      onDone={onAddAssetDone}
    />
  </div>;
};

export default memo(PatrolForm);
