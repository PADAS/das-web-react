import { useEffect, useId, useRef, useState } from 'react';
import Button from 'react-bootstrap/Button';
import { useTranslation } from 'react-i18next';

import ACTION_FORMS from './actionForms';
import { HOST_TOOL_SPECS } from '../../hostActions';
import useNavigate from '../../hooks/useNavigate';
import useRunHostAction from '../../hostActions/useRunHostAction';
import useTargetOptions from './useTargetOptions';

import * as styles from './styles.module.scss';

// Long enough to read the confirmation before the view changes.
export const SWITCH_DELAY_MS = 1500;

const INITIAL_PICKS = Object.fromEntries(
  Object.entries(ACTION_FORMS).map(([name, actionForm]) => [name, actionForm.initialPicks()])
);

// Stands in for the Atlas tab: pick an action and what it acts on, see the
// file Atlas would attach to a reply, run it the way an Atlas call is run,
// then follow it to the view that shows what changed.
const AtlasActionsPlayground = ({ isActive }) => {
  const { t } = useTranslation('components', { keyPrefix: 'sideBar.atlasActionsPlayground' });

  const navigate = useNavigate();
  const options = useTargetOptions();
  const runHostAction = useRunHostAction();

  const actionSelectId = useId();
  const fileTextareaId = useId();

  const switchTimeoutRef = useRef(null);

  const [actionName, setActionName] = useState(HOST_TOOL_SPECS[0].name);
  const [callCount, setCallCount] = useState(0);
  const [editedFileText, setEditedFileText] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [picksByAction, setPicksByAction] = useState(INITIAL_PICKS);
  const [run, setRun] = useState(null);
  const [switchesView, setSwitchesView] = useState(true);
  const [switchingTo, setSwitchingTo] = useState(null);

  const actionForm = ACTION_FORMS[actionName];
  const actionSpec = HOST_TOOL_SPECS.find((hostToolSpec) => hostToolSpec.name === actionName);
  const picks = picksByAction[actionName];

  const generatedFileText = JSON.stringify(
    { name: actionName, arguments: actionForm.toArguments(picks, options) },
    null,
    2
  );
  const fileText = editedFileText ?? generatedFileText;

  const setPick = (key, value) => {
    setEditedFileText(null);
    setPicksByAction({ ...picksByAction, [actionName]: { ...picks, [key]: value } });
  };

  const onChangeAction = (event) => {
    setEditedFileText(null);
    setActionName(event.target.value);
  };

  const loadFile = async (file) => {
    if (file) setEditedFileText(await file.text());
  };

  const onDropFile = (event) => {
    event.preventDefault();

    loadFile(event.dataTransfer.files[0]);
  };

  const onRun = async () => {
    clearTimeout(switchTimeoutRef.current);
    setSwitchingTo(null);

    let action;
    try {
      action = JSON.parse(fileText);
    } catch (error) {
      setRun({ parseError: error.message });

      return;
    }

    const id = `call-${callCount + 1}`;
    setCallCount(callCount + 1);
    setIsRunning(true);

    const call = { arguments: action?.arguments ?? {}, id, name: action?.name, type: 'otus:tool-call' };
    const result = { id, ...await runHostAction(call.name, call.arguments), type: 'otus:tool-result' };

    setIsRunning(false);
    setRun({ call, result });

    const destination = result.ok && switchesView ? ACTION_FORMS[call.name]?.destination(call.arguments) : null;
    if (destination) {
      setSwitchingTo(destination);

      switchTimeoutRef.current = setTimeout(() => {
        setSwitchingTo(null);
        navigate(destination.to, destination.state && { state: destination.state });
      }, SWITCH_DELAY_MS);
    }
  };

  useEffect(() => () => clearTimeout(switchTimeoutRef.current), []);

  return <section className={`${styles.playground} ${isActive ? styles.active : ''}`} hidden={!isActive}>
    <p className={styles.intro}>{t('intro')}</p>

    <label className={styles.label} htmlFor={actionSelectId}>{t('actionLabel')}</label>
    <select className={styles.select} id={actionSelectId} onChange={onChangeAction} value={actionName}>
      {HOST_TOOL_SPECS.map((hostToolSpec) => <option key={hostToolSpec.name}>{hostToolSpec.name}</option>)}
    </select>
    <p className={styles.description}>{actionSpec.description}</p>

    <h4 className={styles.heading}>{t('targetsHeading')}</h4>
    <div className={styles.targets}>
      {actionForm.render({ options, picks, setPick, spec: actionSpec, t })}
    </div>

    <label className={styles.label} htmlFor={fileTextareaId}>{t('fileLabel')}</label>
    <textarea
      className={styles.code}
      id={fileTextareaId}
      onChange={(event) => setEditedFileText(event.target.value)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDropFile}
      rows={8}
      spellCheck={false}
      value={fileText}
    />
    {editedFileText !== null && <p className={styles.description}>{t('editedFileNote')}</p>}

    <div className={styles.buttons}>
      <label className={styles.option}>
        <input checked={switchesView} onChange={(event) => setSwitchesView(event.target.checked)} type="checkbox" />
        <span>{t('switchViewLabel')}</span>
      </label>

      <label className={`btn btn-outline-secondary btn-sm ${styles.fileButton}`}>
        {t('loadFileButton')}
        <input
          accept=".json,application/json"
          className={styles.fileInput}
          onChange={(event) => loadFile(event.target.files[0])}
          type="file"
        />
      </label>

      <Button disabled={isRunning || !!switchingTo} onClick={onRun} size="sm" type="button" variant="primary">
        {t('runButton')}
      </Button>
    </div>

    <details className={styles.schema}>
      <summary>{t('schemaSummary')}</summary>
      <pre className={styles.code}>{JSON.stringify(actionSpec.inputSchema, null, 2)}</pre>
    </details>

    <h4 className={styles.heading}>{t('resultHeading')}</h4>
    {!run && <p className={styles.empty}>{t('emptyResult')}</p>}

    {run?.parseError && <p className={styles.error} role="alert">{t('parseError', { message: run.parseError })}</p>}

    {run?.result && <>
      <p className={run.result.ok ? styles.ok : styles.error} role="status">
        {run.result.ok
          ? t('okStatus', { name: run.call.name })
          : t('errorStatus', { code: run.result.error.code, name: run.call.name })}
        {switchingTo && <> {t('switchingTo', { view: t(switchingTo.labelKey) })}</>}
      </p>
      {!run.result.ok && <p className={styles.error}>{run.result.error.message}</p>}

      <h5 className={styles.subheading}>{t('callHeading')}</h5>
      <pre className={styles.code}>{JSON.stringify(run.call, null, 2)}</pre>

      <h5 className={styles.subheading}>{t('replyHeading')}</h5>
      <pre className={styles.code}>{JSON.stringify(run.result, null, 2)}</pre>
    </>}
  </section>;
};

export default AtlasActionsPlayground;
