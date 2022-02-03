import React, { useMemo, useState, useEffect, useContext } from 'react';

import { FieldAssignmentMap, BaseRow } from '../parser';
import { FileStep, FileStepState } from './file-step/FileStep';
import { generatePreviewColumns } from './fields-step/ColumnPreview';
import { FieldsStep, Field } from './fields-step/FieldsStep';
import { ProgressDisplay } from './ProgressDisplay';
import {
  ImporterFilePreview,
  ImporterProps,
  ImporterFieldProps
} from './ImporterProps';

import './Importer.scss';

// internal context for registering field definitions
type FieldDef = Field & { id: number };
type FieldListSetter = (prev: FieldDef[]) => FieldDef[];

const FieldDefinitionContext = React.createContext<
  ((setter: FieldListSetter) => void) | null
>(null);

let fieldIdCount = 0;

// defines a field to be filled from file column during import
export const ImporterField: React.FC<ImporterFieldProps> = ({
  name,
  label,
  optional
}) => {
  // @todo this is not SSR-compatible
  const fieldId = useMemo(() => (fieldIdCount += 1), []);
  const fieldSetter = useContext(FieldDefinitionContext);

  // update central list as needed
  useEffect(() => {
    if (!fieldSetter) {
      console.error('importer field must be a child of importer'); // @todo
      return;
    }

    fieldSetter((prev) => {
      const newField = { id: fieldId, name, label, isOptional: !!optional };

      const copy = [...prev];
      const existingIndex = copy.findIndex((item) => item.name === name);

      // preserve existing array position if possible
      // @todo keep both copies in a map to deal with dynamic fields better
      if (existingIndex === -1) {
        copy.push(newField);
      } else {
        copy[existingIndex] = newField;
      }

      return copy;
    });
  }, [fieldId, fieldSetter, name, label, optional]);

  // on component unmount, remove this field from list by ID
  useEffect(() => {
    if (!fieldSetter) {
      console.error('importer field must be a child of importer'); // @todo
      return;
    }

    return () => {
      fieldSetter((prev) => {
        return prev.filter((field) => field.id !== fieldId);
      });
    };
  }, [fieldId, fieldSetter]);

  return null;
};

export function Importer<Row extends BaseRow>({
  assumeNoHeaders,
  restartable,
  processChunk,
  onStart,
  onComplete,
  onClose,
  children: content,
  ...customPapaParseConfig
}: ImporterProps<Row>): React.ReactElement {
  // helper to combine our displayed content and the user code that provides field definitions
  const [fields, setFields] = useState<FieldDef[]>([]);

  const [fileState, setFileState] = useState<FileStepState | null>(null);
  const [fileAccepted, setFileAccepted] = useState<boolean>(false);

  const [
    fieldAssignments,
    setFieldAssignments
  ] = useState<FieldAssignmentMap | null>(null);

  const externalPreview = useMemo<ImporterFilePreview | null>(() => {
    // generate stable externally-visible data objects
    const externalColumns =
      fileState &&
      generatePreviewColumns(fileState.firstRows, fileState.hasHeaders);
    return (
      fileState &&
      externalColumns && {
        rawData: fileState.firstChunk,
        columns: externalColumns,
        skipHeaders: !fileState.hasHeaders,
        parseWarning: fileState.parseWarning
      }
    );
  }, [fileState]);

  // render provided child content that defines the fields
  const contentNodes = useMemo(() => {
    return typeof content === 'function'
      ? content({
          file: fileState && fileState.file,
          preview: externalPreview
        })
      : content;
  }, [fileState, externalPreview, content]);
  const contentWrap = (
    <FieldDefinitionContext.Provider value={setFields}>
      {contentNodes}
    </FieldDefinitionContext.Provider>
  );

  if (!fileAccepted || fileState === null || externalPreview === null) {
    return (
      <div className="CSVImporter_Importer">
        <FileStep
          customConfig={customPapaParseConfig}
          assumeNoHeaders={assumeNoHeaders}
          prevState={fileState}
          onChange={(parsedPreview) => {
            setFileState(parsedPreview);
          }}
          onAccept={() => {
            setFileAccepted(true);
          }}
        />

        {contentWrap}
      </div>
    );
  }

  if (fieldAssignments === null) {
    return (
      <div className="CSVImporter_Importer">
        <FieldsStep
          fileState={fileState}
          fields={fields}
          onAccept={(assignments) => {
            // @todo use onChange to preserve this state if going back and toggling hasHeaders
            setFieldAssignments(assignments);
          }}
          onCancel={() => {
            // keep existing preview data
            setFileAccepted(false);
          }}
        />

        {contentWrap}
      </div>
    );
  }

  return (
    <div className="CSVImporter_Importer">
      <ProgressDisplay
        fileState={fileState}
        externalPreview={externalPreview}
        fieldAssignments={fieldAssignments}
        processChunk={processChunk}
        onStart={onStart}
        onRestart={
          restartable
            ? () => {
                // reset all state
                setFileState(null);
                setFileAccepted(false);
                setFieldAssignments(null);
              }
            : undefined
        }
        onComplete={onComplete}
        onClose={onClose}
      />

      {contentWrap}
    </div>
  );
}
