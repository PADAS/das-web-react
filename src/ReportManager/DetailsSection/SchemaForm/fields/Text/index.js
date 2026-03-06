import React, { memo, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ArrowUpRightFromSquareIcon } from '../../../../../common/images/icons/arrow-up-right-from-square.svg';

import { getIsValidWebUrl } from '../../../../../utils/string';
import { TEXT_ELEMENT_FORMAT_VALIDATIONS, TEXT_ELEMENT_INPUT_TYPES } from '../../../../../utils/v2-event-schemas/constants';

import * as styles from './styles.module.scss';

const ShortTextInput = (props) => <input className={styles.shortTextInput} type="text" {...props} />;

const LongTextInput = (props) => <textarea className={styles.longTextInput} {...props} />;

const INPUTS = {
  [TEXT_ELEMENT_INPUT_TYPES.SHORT]: ShortTextInput,
  [TEXT_ELEMENT_INPUT_TYPES.LONG]: LongTextInput,
};

const Text = ({ details, error, id, onFieldChange, readOnly, value = '' }) => {
  const { t } = useTranslation('reports', { keyPrefix: 'reportManager.detailsSection.schemaForm.fields.text' });

  const inputRef = useRef(null);

  const Input = INPUTS[details.inputType];

  const hasError = !!error;

  const showUrlLink = useMemo(
    () => readOnly && details.formatValidation === TEXT_ELEMENT_FORMAT_VALIDATIONS.URI && getIsValidWebUrl(value),
    [details.formatValidation, readOnly, value]
  );

  return <div className={styles.text} data-testid={`schema-form-text-field-${id}`}>
    <label className={`${styles.label} ${hasError ? styles.error : ''}`} htmlFor={id}>
      {details.label}

      {details.isRequired && <span aria-hidden="true"> *</span>}
    </label>

    <div
      className={`${styles.textInput} ${readOnly ? styles.readOnly : ''} ${hasError ? styles.error : ''}`}
      data-testid={`schemaForm-field-text-${id}-textInput`}
      onClick={(event) => event.target === event.currentTarget && inputRef.current?.focus()}
    >
      <Input
        aria-describedby={`${id}-description`}
        aria-errormessage={hasError ? `${id}-description` : undefined}
        aria-invalid={hasError ? 'true' : 'false'}
        aria-required={details.isRequired}
        id={id}
        onChange={(event) => onFieldChange(id, event.currentTarget.value || undefined)}
        placeholder={details.hint}
        readOnly={readOnly}
        ref={inputRef}
        value={value}
      />

      {showUrlLink && <a
        aria-label={t('urlLinkLabel')}
        className={styles.urlLink}
        href={value}
        rel="noopener noreferrer"
        target="_blank"
      >
        <ArrowUpRightFromSquareIcon aria-hidden="true" />
      </a>}
    </div>

    <p
      className={`${styles.description} ${hasError ? styles.error : ''}`}
      id={`${id}-description`}
    >
      {error?.message || details.description}
    </p>
  </div>;
};

export default memo(Text);
