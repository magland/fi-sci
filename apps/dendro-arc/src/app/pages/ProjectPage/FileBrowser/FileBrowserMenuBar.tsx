import { SmallIconButton } from "@fi-sci/misc";
import { Delete, Preview, Refresh } from "@mui/icons-material";
import { FunctionComponent, useCallback, useMemo, useState } from "react";
import useRoute from "../../../useRoute";
import { useProject } from "../ProjectPageContext";

type FileBrowserMenuBarProps = {
    width: number
    height: number
    selectedFileNames: string[]
    onResetSelection: () => void
    onRunBatchSpikeSorting?: (filePaths: string[]) => void
    onRunFileAction?: (actionName: string, filePaths: string[]) => void
    onOpenInNeurosift?: (filePaths: string[]) => void
}

const FileBrowserMenuBar: FunctionComponent<FileBrowserMenuBarProps> = ({ width, height, selectedFileNames, onResetSelection, onRunBatchSpikeSorting, onRunFileAction, onOpenInNeurosift }) => {
    const {deleteFile, refreshFiles, projectRole} = useProject()
    const {route} = useRoute()
    const [operating, setOperating] = useState(false)
    const handleDelete = useCallback(async () => {
        if (!['admin', 'editor'].includes(projectRole || '')) {
            alert('You are not authorized to delete files in this project.')
            return
        }
        const okay = window.confirm(`Are you sure you want to delete these ${selectedFileNames.length} files?`)
        if (!okay) return
        try {
            setOperating(true)
            for (const fileName of selectedFileNames) {
                await deleteFile(fileName)
            }
        }
        finally {
            setOperating(false)
            refreshFiles()
            onResetSelection()
        }
    }, [selectedFileNames, deleteFile, refreshFiles, onResetSelection, projectRole])

    const okayToOpenInNeurosift = useMemo(() => (
        selectedFileNames.length > 0 && selectedFileNames.every(fn => fn.endsWith('.nwb')) && selectedFileNames.length <= 5
    ), [selectedFileNames])

    if (route.page !== 'project') {
        throw Error(`Unexpected route page: ${route.page}`)
    }

    return (
        <div style={{display: 'flex'}}>
            {/* <SmallIconButton
                icon={<Add />}
                disabled={operating}
                title="Add a new file"
                label="Add file"
                onClick={openNewFileWindow}
            />
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; */}
            {/* Refresh */}
            <SmallIconButton
                icon={<Refresh />}
                disabled={operating}
                title="Refresh"
                onClick={refreshFiles}
            />
            <SmallIconButton
                icon={<Delete />}
                disabled={(selectedFileNames.length === 0) || operating}
                title={selectedFileNames.length > 0 ? `Delete these ${selectedFileNames.length} files` : ''}
                onClick={handleDelete}
            />
            {
                okayToOpenInNeurosift && onOpenInNeurosift && (
                    <>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        <SmallIconButton
                            icon={<Preview />}
                            disabled={(selectedFileNames.length === 0) || operating}
                            title={selectedFileNames.length > 0 ? `Open these ${selectedFileNames.length} files in Neurosift` : ''}
                            onClick={() => onOpenInNeurosift(selectedFileNames)}
                            label="Open in Neurosift"
                        />
                    </>
                )
            }
            &nbsp;&nbsp;&nbsp;
        </div>
    )
}

export default FileBrowserMenuBar