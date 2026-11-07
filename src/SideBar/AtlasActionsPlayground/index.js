import { useEffect, useId, useMemo, useRef, useState } from 'react';
import Button from 'react-bootstrap/Button';
import { useTranslation } from 'react-i18next';

import { buildSteps, humanizePropertyName, initialValues, STEP_KINDS, toArguments } from './specSteps';
import DESTINATIONS from './destinations';
import { HOST_TOOL_SPECS } from '../../hostActions';
import useNavigate from '../../hooks/useNavigate';
import useRunHostAction from '../../hostActions/useRunHostAction';
import useSources from './useSources';

import SpecField from './SpecField';

import * as styles from './styles.module.scss';

// Long enough to read the confirmation before the view changes.
export const SWITCH_DELAY_MS = 1500;

const INITIAL_VALUES = Object.fromEntries(
  HOST_TOOL_SPECS.map((hostToolSpec) => [hostToolSpec.name, initialValues(hostToolSpec.inputSchema)])
);

// Stands in for the Atlas tab. Step by step, it builds the file Atlas would
// attach to a reply from the action's own spec and the site's data, runs it
// the way an Atlas call is run, then follows it to the view that shows what
// changed.
const AtlasActionsPlayground = ({ isActive }) => {
  const { t } = useTranslation('components', { keyPrefix: 'sideBar.atlasActionsPlayground' });

  const navigate = useNavigate();
  const runHostAction = useRunHostAction();
  const sources = useSources();

  const actionSelectId = useId();
  const fileTextareaId = useId();

  const switchTimeoutRef = useRef(null);

  const [actionName, setActionName] = useState(HOST_TOOL_SPECS[0].name);
  const [callCount, setCallCount] = useState(0);
  const [editedFileText, setEditedFileText] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [run, setRun] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [switchesView, setSwitchesView] = useState(true);
  const [switchingTo, setSwitchingTo] = useState(null);
  const [valuesByAction, setValuesByAction] = useState(INITIAL_VALUES);

  const actionSpec = HOST_TOOL_SPECS.find((hostToolSpec) => hostToolSpec.name === actionName);
  const { inputSchema } = actionSpec;
  const values = valuesByAction[actionName];

  // Step 0 picks the action. The spec decides the rest.
  const steps = useMemo(() => buildSteps(inputSchema), [inputSchema]);
  const step = stepIndex === 0 ? null : steps[stepIndex - 1];
  const stepCount = steps.length + 1;

  const generatedFileText = JSON.stringify({ name: actionName, arguments: toArguments(inputSchema, values) }, null, 2);
  const fileText = editedFileText ?? generatedFileText;

  const stepTitle = (index) => {
    if (index === 0) return t('steps.action');

    const { kind, names } = steps[index - 1];
    if (kind === STEP_KINDS.SOURCE) return t(`properties.${names[0]}`, { defaultValue: humanizePropertyName(names[0]) });

    return t(`steps.${kind}`);
  };

  const setValue = (name, value) => {
    setEditedFileText(null);
    setValuesByAction({ ...valuesByAction, [actionName]: { ...values, [name]: value } });
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

    const destination = result.ok && switchesView ? DESTINATIONS[call.name]?.(call.arguments) : null;
    if (destination) {
      setSwitchingTo(destination);

      switchTimeoutRef.current = setTimeout(() => {
        setSwitchingTo(null);
        navigate(destination.to, destination.state && { state: destination.state });
      }, SWITCH_DELAY_MS);
    }
  };

  useEffect(() => () => clearTimeout(switchTimeoutRef.current), []);

  const renderFields = (names) => names.map((name) => <SpecField
    key={name}
    name={name}
    onChange={(value) => setValue(name, value)}
    properties={inputSchema.properties}
    required={inputSchema.required?.includes(name)}
    schema={inputSchema.properties[name]}
    sources={sources}
    t={t}
    value={values[name]}
    values={values}
  />);

  return <section className={`${styles.playground} ${isActive ? styles.active : ''}`} hidden={!isActive}>
    <p className={styles.intro}>{t('intro')}</p>

    <ol aria-label={t('stepsLabel')} className={styles.stepList}>
      {Array.from({ length: stepCount }, (_, index) => <li key={index}>
        <button
          aria-current={index === stepIndex ? 'step' : undefined}
          className={`${styles.stepButton} ${index === stepIndex ? styles.currentStep : ''}`}
          onClick={() => setStepIndex(index)}
          type="button"
        >
          {index + 1}. {stepTitle(index)}
        </button>
      </li>)}
    </ol>

    <h4 className={styles.heading}>{t('stepHeading', { count: stepCount, number: stepIndex + 1, title: stepTitle(stepIndex) })}</h4>

    <div className={styles.targets}>
      {stepIndex === 0 && <>
        <label className={styles.label} htmlFor={actionSelectId}>{t('actionLabel')}</label>
        <select className={styles.select} id={actionSelectId} onChange={onChangeAction} value={actionName}>
          {HOST_TOOL_SPECS.map((hostToolSpec) => <option key={hostToolSpec.name}>{hostToolSpec.name}</option>)}
        </select>
        <p className={styles.description}>{actionSpec.description}</p>
      </>}

      {step && step.kind !== STEP_KINDS.REVIEW && renderFields(step.names)}

      {step?.kind === STEP_KINDS.REVIEW && <>
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
          <pre className={styles.code}>{JSON.stringify(inputSchema, null, 2)}</pre>
        </details>
      </>}
    </div>

    <div className={styles.stepButtons}>
      <Button disabled={stepIndex === 0} onClick={() => setStepIndex(stepIndex - 1)} size="sm" type="button" variant="secondary">
        {t('backButton')}
      </Button>
      {stepIndex < stepCount - 1 && <Button onClick={() => setStepIndex(stepIndex + 1)} size="sm" type="button" variant="primary">
        {t('nextButton')}
      </Button>}
    </div>

    {step?.kind === STEP_KINDS.REVIEW && <>
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
    </>}
  </section>;
};

export default AtlasActionsPlayground;
