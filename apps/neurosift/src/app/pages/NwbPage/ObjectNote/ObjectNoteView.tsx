import { FunctionComponent, useCallback, useEffect, useMemo, useState } from "react"
import useNwbFileAnnotations from "../NwbFileAnnotations/useNwbFileAnnotations"
import { NeurosiftAnnotation } from "../../../NeurosiftAnnotations/useNeurosiftAnnotations"

type ObjectNoteViewProps = {
    objectPath: string
    onClose: () => void
}

const ObjectNoteView: FunctionComponent<ObjectNoteViewProps> = ({objectPath, onClose}) => {
    const {nwbFileAnnotations, addNwbFileAnnotation, removeNwbFileAnnotation} = useNwbFileAnnotations()
    const [operating, setOperating] = useState(false)
    const thisNote = useMemo(() => {
        if (!nwbFileAnnotations) return undefined
        const note = nwbFileAnnotations.find(a => a.type === 'note' && a.data.path === objectPath)
        return note
    }, [nwbFileAnnotations, objectPath])

    if (!nwbFileAnnotations) return <span />
    return (
        <div>
            <h3>Note for {objectPath}</h3>
            <div>
                <EditNoteText
                    value={thisNote?.data.text || ''}
                    disabled={operating}
                    onChange={text => {
                        if (text) {
                            setOperating(true)
                            const newNoteAnnotation: NeurosiftAnnotation = {
                                id: makeRandomId(),
                                type: 'note',
                                user: 'unknown',
                                timestamp: Date.now(),
                                data: {
                                    path: objectPath,
                                    text
                                }
                            }
                            addNwbFileAnnotation(newNoteAnnotation, {replace: thisNote?.id}).then(() => {
                                setOperating(false)
                                onClose()
                            })
                        }
                        else {
                            if (thisNote) {
                                setOperating(true)
                                removeNwbFileAnnotation(thisNote.id).then(() => {
                                    setOperating(false)
                                    onClose()
                                })
                            }
                        }
                    }}
                    onCancel={onClose}
                />
            </div>
        </div>
    )
}

type EditNoteTextProps = {
    value: string
    onChange: (value: string) => void
    disabled: boolean
    onCancel: () => void
}

const EditNoteText: FunctionComponent<EditNoteTextProps> = ({value, onChange, disabled, onCancel}) => {
    const [internalValue, setInternalValue] = useState(value)
    useEffect(() => {
        setInternalValue(value)
    }, [value])
    const handleSave = useCallback(() => {
        onChange(internalValue)
    }, [internalValue, onChange])
    const modified = internalValue !== value
    return (
        <div>
            <textarea
                value={internalValue}
                disabled={disabled}
                onChange={e => setInternalValue(e.target.value)}
                style={{width: '100%', height: 100}}
            />
            <div>
                <button disabled={disabled || !modified} onClick={handleSave}>Save</button>
                &nbsp;
                <button disabled={disabled} onClick={onCancel}>Cancel</button>
            </div>
        </div>
    
    )
}

const makeRandomId = () => {
    const numChars = 10
    const choices = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let id = ''
    for (let i = 0; i < numChars; i++) {
        id += choices.charAt(Math.floor(Math.random() * choices.length))
    }
    return id
}

export default ObjectNoteView