import { FunctionComponent, useEffect, useState } from "react"
import useNwbFileAnnotations from "../NwbFileAnnotations/useNwbFileAnnotations"
import { Hyperlink } from "@fi-sci/misc"
import useNeurosiftAnnotations from "../../../NeurosiftAnnotations/useNeurosiftAnnotations"

type NeurosiftAnnotationsViewProps = {
    width: number
    height: number
}

const NeurosiftAnnotationsView: FunctionComponent<NeurosiftAnnotationsViewProps> = ({ width, height }) => {
    const {neurosiftAnnotationsAccessToken} = useNeurosiftAnnotations()
    const {nwbFileAnnotations, refreshNwbFileAnnotations, annotationsRepo, setAnnotationsRepo} = useNwbFileAnnotations()
    useEffect(() => {
        refreshNwbFileAnnotations()
    }, [refreshNwbFileAnnotations])
    return (
        <div style={{ position: 'absolute', width, height, backgroundColor: '#eee', padding: 10, overflowY: 'auto' }}>
            <div>
                {
                    neurosiftAnnotationsAccessToken ? (
                        <p style={{color: 'darkgreen'}}>You are logged in to neurosift-annotations</p>
                    ) : (
                        <p style={{color: 'darkred'}}>You are not logged in to neurosift-annotations</p>
                    )
                }
            </div>
            <div>
                <p><Hyperlink href="https://github.com/flatironinstitute/neurosift/blob/main/doc/neurosift_annotations.md" target="_blank">
                    View instructions for setting up neurosift-annotations
                </Hyperlink></p>
            </div>
            <div>
                <p>
                    You can use the neurosift-annotations app to annotate your NWB file, with results
                    being stored in a GitHub repository. <Hyperlink href="https://github.com/flatironinstitute/neurosift/blob/main/doc/neurosift_annotations.md" target="_blank">Read more...</Hyperlink>
                </p>
            </div>
            <hr />
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
            {nwbFileAnnotations && <div>
                <p>This file has {nwbFileAnnotations.length} {nwbFileAnnotations.length === 1 ? 'annotation' : 'annotations'}.</p>
            </div>}
            <div>
                <p>You can add a top-level note for this file (see icon on left panel), or to individual neurodata objects.</p>
            </div>
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

