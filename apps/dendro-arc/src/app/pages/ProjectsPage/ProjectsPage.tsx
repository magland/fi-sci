import { SmallIconButton } from "@fi-sci/misc";
import { Add } from "@mui/icons-material";
import { FunctionComponent, useCallback } from "react";
import { useGithubAuth } from "../../GithubAuth/useGithubAuth";
import { createProject, setProjectTags } from "../../dbInterface/dbInterface";
import useRoute from "../../useRoute";
import './ProjectsPage.css';
import ProjectsTable from "./ProjectsTable";

type Props = {
    width: number
    height: number
}

const ProjectsPage: FunctionComponent<Props> = ({width, height}) => {
    const {setRoute} = useRoute()

    const auth = useGithubAuth()

    const handleAdd = useCallback(async () => {
        if (!auth.signedIn) {
            alert('You must be signed in to create a project')
            return
        }
        const projectName = prompt('Enter a name for your project', 'untitled')
        if (!projectName) return
        const newProjectId = await createProject(projectName, auth)
        await setProjectTags(newProjectId, ['arc'], auth)
        setRoute({page: 'project', projectId: newProjectId, tab: 'project-home'})
    }, [setRoute, auth])

    return (
        <div className="projects-page" style={{position: 'absolute', width, height, overflowY: 'auto'}}>
            <h3 style={{paddingLeft: 10}}>Your projects</h3>
            <div style={{paddingLeft: 10}}>
                <SmallIconButton icon={<Add />} onClick={handleAdd} label="Create a new project" />
            </div>
            <br />
            <ProjectsTable />
        </div>
    )
}

export default ProjectsPage