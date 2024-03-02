import { FunctionComponent, useMemo } from "react"
import useNwbFileAnnotations from "../NwbFileAnnotations/useNwbFileAnnotations"
import { SmallIconButton } from "@fi-sci/misc"
import { Note } from "@mui/icons-material"
import ModalWindow, { useModalWindow } from "@fi-sci/modal-window"
import ObjectNoteView from "./ObjectNoteView"

type ViewObjectAnnotationIconThingProps = {
    objectPath: string
    previewText?: boolean
}

const ViewObjectNoteIconThing: FunctionComponent<ViewObjectAnnotationIconThingProps> = ({objectPath, previewText}) => {
    const {nwbFileAnnotations} = useNwbFileAnnotations()
    const thisNote = useMemo(() => {
        if (!nwbFileAnnotations) return undefined
        const note = nwbFileAnnotations.find(a => a.type === 'note' && a.data.path === objectPath)
        return note
    }, [nwbFileAnnotations, objectPath])

    const {handleOpen: openNote, handleClose: closeNote, visible: noteVisible} = useModalWindow()

    if (!nwbFileAnnotations) return <span />
    return (
        <div>
            <span style={{color: thisNote ? 'darkgreen' : 'black'}}>
                <SmallIconButton
                    icon={<Note />}
                    title={objectPath === '/' ? 'Open top-level note for this file' : `Open note for ${objectPath}`}
                    onClick={() => {
                        openNote()
                    }}
                />
            </span>
            {
                previewText && thisNote && <span>&nbsp;&nbsp;{thisNote.data.text}</span>
            }
            <ModalWindow
                visible={noteVisible}
                onClose={closeNote}
            >
                <ObjectNoteView objectPath={objectPath} onClose={closeNote} />
            </ModalWindow>
        </div>
    )
}

export default ViewObjectNoteIconThing