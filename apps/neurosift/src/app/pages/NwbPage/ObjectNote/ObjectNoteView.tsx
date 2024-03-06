import { SmallIconButton } from '@fi-sci/misc';
import { Link } from '@mui/icons-material';
import { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react';
import useNwbFileAnnotations, { NeurosiftAnnotationItem } from '../NwbFileAnnotations/useNwbFileAnnotations';

type ObjectNoteViewProps = {
  objectPath: string;
  onClose: () => void;
};

const ObjectNoteView: FunctionComponent<ObjectNoteViewProps> = ({ objectPath, onClose }) => {
  const { nwbFileAnnotationItems, addNwbFileAnnotationItem, removeNwbFileAnnotationItem, annotationsRepo } =
    useNwbFileAnnotations();
  const [operating, setOperating] = useState(false);
  const notesForThisObject = useMemo(() => {
    if (!nwbFileAnnotationItems) return undefined;
    const notes = nwbFileAnnotationItems.filter((a) => a.type === 'note' && a.data.path === objectPath);
    return notes;
  }, [nwbFileAnnotationItems, objectPath]);

  const notesForThisRepo = useMemo(() => {
    const ret: (NeurosiftAnnotationItem | undefined)[] = (notesForThisObject || [])
    .filter((n) => n.repo === annotationsRepo)
    if (ret.length === 0 && annotationsRepo) {
      ret.push(undefined) // this is a placeholder for the note that will be added
    }
    return ret
  }, [notesForThisObject, annotationsRepo]);

  if (!nwbFileAnnotationItems) return <span />;
  return (
    <div>
      {annotationsRepo && (
        <>
          <h3>
            {objectPath !== '/' ? <span>Notes for {objectPath} in {annotationsRepo}</span> : <span>Top-level notes in {annotationsRepo}</span>}
          </h3>
          <div>
            {notesForThisRepo
              .map((note) => (
                <div key={note?.id || 'undefined'}>
                  <RepoHeading repo={annotationsRepo} />
                  <EditNoteText
                    value={note?.data.text || ''}
                    disabled={operating || !annotationsRepo}
                    onChange={(text) => {
                      if (text) {
                        setOperating(true);
                        const newNoteAnnotation: NeurosiftAnnotationItem = {
                          id: makeRandomId(),
                          type: 'note',
                          user: 'unknown',
                          timestamp: Date.now(),
                          data: {
                            path: objectPath,
                            text,
                          },
                          repo: annotationsRepo,
                        };
                        addNwbFileAnnotationItem(newNoteAnnotation, { replace: note?.id }).then(() => {
                          setOperating(false);
                          onClose();
                        });
                      } else {
                        if (note) {
                          setOperating(true);
                          removeNwbFileAnnotationItem(note.id).then(() => {
                            setOperating(false);
                            onClose();
                          });
                        }
                      }
                    }}
                    onCancel={onClose}
                  />
                </div>
              ))}
          </div>
        </>
      )}
      <hr />
      <h3>{objectPath !== '/' ? <span>Notes for {objectPath} in other repositories</span> : <span>Top-level notes in other repositories</span>}</h3>
      {(notesForThisObject || [])
        .filter((n) => n.repo !== annotationsRepo)
        .map((note) => (
          <div key={note.id}>
            <RepoHeading repo={note.repo} />
            <div>{note.data.text}</div>
          </div>
        ))}
    </div>
  );
};

type RepoHeadingProps = {
  repo: string;
};

const RepoHeading: FunctionComponent<RepoHeadingProps> = ({ repo }) => {
  return (
    <h4>
        {repo}&nbsp;&nbsp;&nbsp;
        <SmallIconButton
            icon={<Link />}
            onClick={() => {
                const repoUrl = getRepoUrl(repo);
                if (repoUrl) {
                    window.open(repoUrl, '_blank');
                }
            }}
        />
    </h4>
  )
};

const getRepoUrl = (repo: string) => {
    const parts = repo.split('/');
    if (repo.startsWith('https://github.com')) {
        return repo;
    }
    else {
        const user = parts[0];
        const repoName = parts[1];
        return `https://github.com/${user}/${repoName}`;
    }
}

type EditNoteTextProps = {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  onCancel: () => void;
};

const EditNoteText: FunctionComponent<EditNoteTextProps> = ({ value, onChange, disabled, onCancel }) => {
  const [internalValue, setInternalValue] = useState(value);
  useEffect(() => {
    setInternalValue(value);
  }, [value]);
  const handleSave = useCallback(() => {
    onChange(internalValue);
  }, [internalValue, onChange]);
  const modified = internalValue !== value;
  return (
    <div>
      <textarea
        value={internalValue}
        disabled={disabled}
        onChange={(e) => setInternalValue(e.target.value)}
        style={{ width: '100%', height: 100 }}
      />
      <div>
        <button disabled={disabled || !modified} onClick={handleSave}>
          Save
        </button>
        &nbsp;
        <button disabled={disabled} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
};

const makeRandomId = () => {
  const numChars = 10;
  const choices = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  for (let i = 0; i < numChars; i++) {
    id += choices.charAt(Math.floor(Math.random() * choices.length));
  }
  return id;
};

export default ObjectNoteView;
