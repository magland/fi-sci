import { Hyperlink } from "@fi-sci/misc"
import { FunctionComponent, useEffect, useState } from "react"
import { NeurosiftAnnotationsLoginView } from "../../../ApiKeysWindow/ApiKeysWindow"
import useNwbFileAnnotations from "../NwbFileAnnotations/useNwbFileAnnotations"
import useNeurosiftAnnotations from "../../../NeurosiftAnnotations/useNeurosiftAnnotations"

type NeurosiftAnnotationsViewProps = {
    width: number
    height: number
}

const NeurosiftAnnotationsView: FunctionComponent<NeurosiftAnnotationsViewProps> = ({ width, height }) => {
    const {neurosiftAnnotationsAccessToken} = useNeurosiftAnnotations()
    const {nwbFileAnnotationItems, refreshNwbFileAnnotationItems, annotationsRepo, setAnnotationsRepo} = useNwbFileAnnotations()
    useEffect(() => {
        refreshNwbFileAnnotationItems()
    }, [refreshNwbFileAnnotationItems])
    const padding = 10
    return (
        <div style={{ position: 'absolute', width: width - padding * 2, height: height - padding * 2, backgroundColor: '#eee', padding, overflowY: 'auto' }}>
            <div>
                <p>
                    Use neurosift-annotations to annotate your NWB file, with results
                    being stored in a GitHub repository.
                </p>
            </div>
            <NeurosiftAnnotationsLoginView
                onClose={undefined}
                onLoggedIn={undefined}
            />
            <div>
                <p><Hyperlink href="https://github.com/flatironinstitute/neurosift/blob/main/doc/neurosift_annotations.md" target="_blank">
                    View instructions for setting up neurosift-annotations
                </Hyperlink></p>
            </div>
            <hr />
            {neurosiftAnnotationsAccessToken && (<span>
                <div>
                    Select a repository for this NWB file (the same repo can be used for multiple NWB files).
                    The repository should be in the form of owner/repo, e.g., nsquold/ns_annotations.
                    <div>&nbsp;</div>
                    <EditAnnotationsRepo
                        value={annotationsRepo}
                        onChange={setAnnotationsRepo}
                    />
                </div>
                <hr />
                {nwbFileAnnotationItems && <div>
                    <p>This file has {nwbFileAnnotationItems.length} {nwbFileAnnotationItems.length === 1 ? 'annotation' : 'annotations'}.</p>
                </div>}
                <div>
                    <p>You can add a top-level note for this file (see icon on left panel), or add notes to individual neurodata objects.</p>
                </div>
            </span>)}
        </div>
    )
}

type EditAnnotationsRepoProps = {
    value: string
    onChange: (value: string) => void
}

const EditAnnotationsRepo: FunctionComponent<EditAnnotationsRepoProps> = ({ value, onChange }) => {
    const [internalValue, setInternalValue] = useState(value)
    useEffect(() => {
        setInternalValue(value)
    }, [value])
    return (
        <div style={{maxWidth: 300}}>
            <input
                style={{color: internalValue === value ? 'black' : 'darkblue'}}
                type="text"
                value={internalValue}
                onChange={e => setInternalValue(e.target.value)}
                onBlur={() => onChange(internalValue)}
                spellCheck={false}
            />
            &nbsp;
            <button
                onClick={() => onChange(internalValue)}
                disabled={internalValue === value}
            >
                Set
            </button>
        </div>
    )
}

export default NeurosiftAnnotationsView;

