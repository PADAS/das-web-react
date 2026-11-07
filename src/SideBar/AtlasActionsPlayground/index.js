import { useId, useState } from 'react';
import Button from 'react-bootstrap/Button';
import { useStore } from 'react-redux';
import { useTranslation } from 'react-i18next';

import buildExampleFile from './buildExampleFile';
import { HOST_TOOL_SPECS } from '../../hostActions';
import useRunHostAction from '../../hostActions/useRunHostAction';

import * as styles from './styles.module.scss';

// Stands in for the Atlas tab: shows the file Atlas would attach to a reply,
// runs it the way an Atlas call is run, and shows the message sent back.
const AtlasActionsPlayground = () => {
  const store = useStore();
  const { t } = useTranslation('components', { keyPrefix: 'sideBar.atlasActionsPlayground' });

  const runHostAction = useRunHostAction();

  const actionSelectId = useId();
  const fileTextareaId = useId();

  const [actionName, setActionName] = useState(HOST_TOOL_SPECS[0].name);
  const [callCount, setCallCount] = useState(0);
  const [fileText, setFileText] = useState(() => buildExampleFile(HOST_TOOL_SPECS[0].name, store.getState()));
  const [isRunning, setIsRunning] = useState(false);
  const [run, setRun] = useState(null);

  const actionSpec = HOST_TOOL_SPECS.find((hostToolSpec) => hostToolSpec.name === actionName);

  const onChangeAction = (event) => {
    setActionName(event.target.value);
    setFileText(buildExampleFile(event.target.value, store.getState()));
  };

  const loadFile = async (file) => {
    if (file) setFileText(await file.text());
  };

  const onDropFile = (event) => {
    event.preventDefault();

    loadFile(event.dataTransfer.files[0]);
  };

  const onRun = async () => {
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
  };

  return <section className={styles.playground}>
    <p className={styles.intro}>{t('intro')}</p>

    <label className={styles.label} htmlFor={actionSelectId}>{t('actionLabel')}</label>
    <select className={styles.select} id={actionSelectId} onChange={onChangeAction} value={actionName}>
      {HOST_TOOL_SPECS.map((hostToolSpec) => <option key={hostToolSpec.name}>{hostToolSpec.name}</option>)}
    </select>
    <p className={styles.description}>{actionSpec.description}</p>

    <label className={styles.label} htmlFor={fileTextareaId}>{t('fileLabel')}</label>
    <textarea
      className={styles.code}
      id={fileTextareaId}
      onChange={(event) => setFileText(event.target.value)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDropFile}
      rows={10}
      spellCheck={false}
      value={fileText}
    />

    <div className={styles.buttons}>
      <label className={`btn btn-outline-secondary btn-sm ${styles.fileButton}`}>
        {t('loadFileButton')}
        <input
          accept=".json,application/json"
          className={styles.fileInput}
          onChange={(event) => loadFile(event.target.files[0])}
          type="file"
        />
      </label>

      <Button disabled={isRunning} onClick={onRun} size="sm" type="button" variant="primary">
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
      </p>

      <h5 className={styles.subheading}>{t('callHeading')}</h5>
      <pre className={styles.code}>{JSON.stringify(run.call, null, 2)}</pre>

      <h5 className={styles.subheading}>{t('replyHeading')}</h5>
      <pre className={styles.code}>{JSON.stringify(run.result, null, 2)}</pre>
    </>}
  </section>;
};

export default AtlasActionsPlayground;
