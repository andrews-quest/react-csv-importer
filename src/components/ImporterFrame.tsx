import React, { useRef, useEffect } from 'react';

import { TextButton } from './TextButton';
import { IconButton } from './IconButton';

import './ImporterFrame.scss';
import { useLocale } from '../locale/LocaleContext';

export const ImporterFrame: React.FC<{
  fileName: string;
  subtitle?: string; // @todo allow multiple crumbs
  importAllLabel?: string;
  importAllDisabled?: boolean;
  secondaryDisabled?: boolean;
  secondaryLabel?: string;
  nextDisabled?: boolean;
  nextLabel: string | false;
  error?: string | null;
  onSecondary?: () => void;
  onImportAll?: () => void;
  onNext: () => void;
  onCancel?: () => void;
}> = ({
  fileName,
  subtitle,
  secondaryDisabled,
  secondaryLabel,
  importAllLabel,
  importAllDisabled,
  nextDisabled,
  nextLabel,
  error,
  onImportAll,
  onSecondary,
  onNext,
  onCancel,
  children
}) => {
  const titleRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (subtitleRef.current) {
      subtitleRef.current.focus();
    } else if (titleRef.current) {
      titleRef.current.focus();
    }
  }, []);

  const l10n = useLocale('general');

  return (
    <div className="CSVImporter_ImporterFrame">
      <div className="CSVImporter_ImporterFrame__header">
        <IconButton
          label={l10n.goToPreviousStepTooltip}
          type="arrowBack"
          disabled={!onCancel}
          onClick={onCancel}
        />

        <div
          className="CSVImporter_ImporterFrame__headerTitle"
          tabIndex={-1}
          ref={titleRef}
        >
          {fileName}
        </div>

        {subtitle ? (
          <>
            <div className="CSVImporter_ImporterFrame__headerCrumbSeparator">
              <span />
            </div>
            <div
              className="CSVImporter_ImporterFrame__headerSubtitle"
              tabIndex={-1}
              ref={subtitleRef}
            >
              {subtitle}
            </div>
          </>
        ) : null}
      </div>

      {children}

      <div className="CSVImporter_ImporterFrame__footer">
        <div className="CSVImporter_ImporterFrame__footerFill" />

        {error ? (
          <div className="CSVImporter_ImporterFrame__footerError" role="status">
            {error}
          </div>
        ) : null}

        {importAllLabel ? (
          <div className="CSVImporter_ImporterFrame__footerSecondary">
            <TextButton disabled={!!importAllDisabled} onClick={onImportAll}>
              {importAllLabel}
            </TextButton>
          </div>
        ) : null}

        {secondaryLabel ? (
          <div className="CSVImporter_ImporterFrame__footerSecondary">
            <TextButton disabled={!!secondaryDisabled} onClick={onSecondary}>
              {secondaryLabel}
            </TextButton>
          </div>
        ) : null}

        {nextLabel !== false ? (
          <div className="CSVImporter_ImporterFrame__footerNext">
            <TextButton disabled={!!nextDisabled} onClick={onNext}>
              {nextLabel}
            </TextButton>
          </div>
        ) : null}
      </div>
    </div>
  );
};
