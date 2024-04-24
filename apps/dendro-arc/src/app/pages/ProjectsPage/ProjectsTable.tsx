import { FunctionComponent, useMemo } from "react"
import UserIdComponent from "../../UserIdComponent"
import { Hyperlink } from "@fi-sci/misc";
import { timeAgoString } from "../../timeStrings"
import useRoute from "../../useRoute"
import useProjectsForUser from './useProjectsForUser'

type Props = {
    admin?: boolean
}

const ProjectsTable: FunctionComponent<Props> = ({admin}) => {
    const projects = useProjectsForUser({admin})

    const { setRoute } = useRoute()

    const filteredProjects = useMemo(() => (
        projects?.filter(p => p.tags.includes('arc'))
    ), [projects])

    const sortedProjects = useMemo(() => {
        return filteredProjects ? filteredProjects.sort((a, b) => b.timestampCreated - a.timestampCreated) : []
    }, [filteredProjects])

    if (!sortedProjects) return <div>Retrieving projects...</div>

    return (
        <table className="scientific-table">
            <thead>
                <tr>
                    <th>Project</th>
                    <th>ID</th>
                    <th>Description</th>
                    <th>Owner</th>
                    <th>Created</th>
                </tr>
            </thead>
            <tbody>
                {
                    sortedProjects.map((pr) => (
                        <tr key={pr.projectId}>
                            <td>
                                <Hyperlink onClick={() => setRoute({page: 'project', projectId: pr.projectId, tab: 'project-home'})}>
                                    {pr.name}
                                </Hyperlink>
                            </td>
                            <td>
                                <Hyperlink onClick={() => setRoute({page: 'project', projectId: pr.projectId, tab: 'project-home'})}>
                                    {pr.projectId}
                                </Hyperlink>
                            </td>
                            <td>
                                {
                                    pr.description
                                }
                            </td>
                            <td><UserIdComponent userId={pr.ownerId} /></td>
                            <td>{timeAgoString(pr.timestampCreated)}</td>
                        </tr>
                    ))
                }
            </tbody>
        </table>
    )
}

export default ProjectsTable