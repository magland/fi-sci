import { Hyperlink, SmallIconButton } from "@fi-sci/misc";
import ModalWindow, { useModalWindow } from "@fi-sci/modal-window";
import { Settings } from "@mui/icons-material";
import { FunctionComponent, useCallback, useEffect, useState } from "react";
import Markdown from "../../Markdown/Markdown";
import { timeAgoString } from "../../timeStrings";
import useRoute from "../../useRoute";
import { useProject } from "./ProjectPageContext";
import ProjectSettingsWindow from "./ProjectSettingsWindow";

type Props = {
    width: number
    height: number
}

const headingStyle: React.CSSProperties = {
    fontSize: 20,
    fontWeight: 'bold',
}

const ProjectHome: FunctionComponent<Props> = ({width, height}) => {
    const {setRoute} = useRoute()
    const {project, files, projectId, projectRole} = useProject()

    const {visible: settingsWindowVisible, handleOpen: openSettingsWindow, handleClose: closeSettingsWindow} = useModalWindow()

    return (
        <div className="ProjectHome" style={{position: 'absolute', width, height, overflowY: 'auto', padding: 10, background: 'white'}}>
            <div style={headingStyle}>Project: {project?.name}</div>
            &nbsp;
            <table className="table1" style={{maxWidth: 800}}>
                <tbody>
                    <tr key="project-name">
                        <td>Project name:</td>
                        <td>{project?.name}</td>
                    </tr>
                    <tr key="project-id">
                        <td>Project ID:</td>
                        <td>{project?.projectId}</td>
                    </tr>
                    <tr key="created">
                        <td>Created:</td>
                        <td>{timeAgoString(project?.timestampCreated)}</td>
                    </tr>
                    <tr key="modified">
                        <td>Modified:</td>
                        <td>{timeAgoString(project?.timestampModified)}</td>
                    </tr>
                    <tr key="num-files">
                        <td>Num. files:</td>
                        <td>{files?.length} (<Hyperlink onClick={() => setRoute({page: 'project', projectId, tab: 'project-files'})}>view files</Hyperlink>)</td>
                    </tr>
                </tbody>
            </table>

            <div>&nbsp;</div><hr /><div>&nbsp;</div>

            <div style={headingStyle}>Description</div>
            <br />
            <div>
                <div style={{maxHeight: 300, overflowY: 'auto'}}>
                    <Markdown
                        source={project?.description || ''}
                    />
                </div>
                <br />
                {['editor', 'admin'].includes(projectRole || '') && (
                    <EditProjectDescription />
                )}
            </div>

            <div>&nbsp;</div><hr /><div>&nbsp;</div>

            <div style={{paddingTop: 10}}>
                <button onClick={openSettingsWindow} title="Project settings"><SmallIconButton icon={<Settings />} /> Project Settings</button>
            </div>

            <div>&nbsp;</div><hr /><div>&nbsp;</div>


            <ModalWindow
                visible={settingsWindowVisible}
                onClose={closeSettingsWindow}
            >
                <ProjectSettingsWindow />
            </ModalWindow>
        </div>
    )
}

const EditProjectDescription: FunctionComponent = () => {
    const {project, setProjectDescription} = useProject()
    const description = project?.description || ''
    const [editing, setEditing] = useState<boolean>(false)
    const [editedDescription, setEditedDescription] = useState<string>('')
    useEffect(() => {
        setEditedDescription(description)
    }, [description])
    const handleSave = useCallback(async () => {
        await setProjectDescription(editedDescription)
        setEditing(false)
    }, [editedDescription, setProjectDescription])
    if (editing) {
        return (
            <div>
                <textarea
                    style={{width: 800, height: 200}}
                    value={editedDescription}
                    onChange={e => setEditedDescription(e.target.value)}
                />
                <div>&nbsp;</div>
                <button onClick={() => {
                    setEditedDescription(description)
                    setEditing(false)
                }}>Cancel</button>
                &nbsp;&nbsp;&nbsp;&nbsp;
                <button onClick={handleSave}>Save</button>
            </div>
        )
    }
    else {
        return (
            <Hyperlink onClick={() => {
                setEditedDescription(description)
                setEditing(true)
            }}>Edit</Hyperlink>
        )
    }
}

export default ProjectHome