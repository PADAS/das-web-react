import React, { memo, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ArrowUpRightFromSquareIcon } from '../../../common/images/icons/arrow-up-right-from-square.svg';

import { getIsValidWebUrl } from '../../../utils/string';
import { TEXT_ELEMENT_FORMAT_VALIDATIONS, TEXT_ELEMENT_INPUT_TYPES } from '../../../utils/form-schemas/constants';
import useFormElementDomId from '../../utils/useFormElementDomId';

import * as styles from './styles.module.scss';

const ShortTextInput = (props) => <input className={styles.shortTextInput} type="text" {...props} />;

const LongTextInput = (props) => <textarea className={styles.longTextInput} {...props} />;

const INPUTS = {
  [TEXT_ELEMENT_INPUT_TYPES.SHORT]: ShortTextInput,
  [TEXT_ELEMENT_INPUT_TYPES.LONG]: LongTextInput,
};

const Text = ({ details, error, formElementId, onFieldChange, readOnly, value = '' }) => {
  const { t } = useTranslation('schema-form', { keyPrefix: 'fields.text' });

  const domId = useFormElementDomId(formElementId);

  const inputRef = useRef(null);

  const Input = INPUTS[details.inputType];

  const hasError = !!error;

  const showUrlLink = useMemo(
    () => readOnly && details.formatValidation === TEXT_ELEMENT_FORMAT_VALIDATIONS.URI && getIsValidWebUrl(value),
    [details.formatValidation, readOnly, value]
  );

  return <div className={styles.text} data-testid={`schema-form-text-field-${formElementId}`}>
    <label className={`${styles.label} ${hasError ? styles.error : ''}`} htmlFor={domId}>
      {details.label}

      {details.isRequired && <span aria-hidden="true"> *</span>}
    </label>

    <div
      className={`${styles.textInput} ${readOnly ? styles.readOnly : ''} ${hasError ? styles.error : ''}`}
      data-testid={`schemaForm-field-text-${formElementId}-textInput`}
      onClick={(event) => event.target === event.currentTarget && inputRef.current?.focus()}
    >
      <Input
        aria-describedby={`${domId}-description`}
        aria-errormessage={hasError ? `${domId}-description` : undefined}
        aria-invalid={hasError ? 'true' : 'false'}
        aria-required={details.isRequired}
        id={domId}
        onChange={(event) => onFieldChange(formElementId, event.currentTarget.value || undefined)}
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
      id={`${domId}-description`}
    >
      {error?.message || details.description}
    </p>
  </div>;
};

export default memo(Text);
