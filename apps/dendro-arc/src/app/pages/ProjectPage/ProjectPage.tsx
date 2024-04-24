/* eslint-disable @typescript-eslint/no-explicit-any */
import { FunctionComponent, useCallback, useEffect, useMemo, useState } from "react";
import useRoute from "../../useRoute";
// import ManualNwbSelector from "./ManualNwbSelector/ManualNwbSelector";
import { HBoxLayout } from "@fi-sci/misc";
import ProjectFiles from "./ProjectFiles";
import ProjectHome from "./ProjectHome";
import { SetupProjectPage, useProject } from "./ProjectPageContext";
import openFilesInNeurosift from "./openFilesInNeurosift";

type Props = {
    width: number
    height: number
}

const ProjectPage: FunctionComponent<Props> = ({width, height}) => {
    const {route} = useRoute()
    if (route.page !== 'project') throw Error('route.page != project')
    const projectId = route.projectId

    return (
        <SetupProjectPage
            projectId={projectId}
        >
            <ProjectPageChild
                width={width}
                height={height}
            />
        </SetupProjectPage>
    )
}

export type ProjectPageViewType = 'project-home' | 'project-files'

type ProjectPageView = {
    type: ProjectPageViewType
    label: string
}

const projectPageViews: ProjectPageView[] = [
    {
        type: 'project-home',
        label: 'Project home'
    },
    {
        type: 'project-files',
        label: 'Files'
    }
]

const ProjectPageChild: FunctionComponent<{width: number, height: number}> = ({width, height}) => {
    const leftMenuPanelWidth = 150
    const statusBarHeight = 16
    return (
        <div>
            <div style={{position: 'absolute', width, height: height - statusBarHeight, overflow: 'hidden'}}>
                <HBoxLayout
                    widths={[leftMenuPanelWidth, width - leftMenuPanelWidth]}
                    height={height - statusBarHeight}
                >
                    <LeftMenuPanel
                        width={0}
                        height={0}
                    />
                    <MainPanel
                        width={0}
                        height={0}
                    />
                </HBoxLayout>
            </div>
            <div style={{position: 'absolute', width, height: statusBarHeight, bottom: 0, background: '#ddd', borderTop: 'solid 1px #aaa', fontSize: 12, paddingRight: 10, textAlign: 'right'}}>
                <StatusBar />
            </div>
        </div>
    )
}

type LeftMenuPanelProps = {
    width: number
    height: number
}

const LeftMenuPanel: FunctionComponent<LeftMenuPanelProps> = ({width, height}) => {
    const {route, setRoute} = useRoute()
    const {projectId} = useProject()
    if (route.page !== 'project') throw Error(`Unexpected route ${JSON.stringify(route)}`)
    const currentView = route.tab || 'project-home'
    return (
        <div style={{position: 'absolute', width, height, overflow: 'hidden', background: '#fafafa'}}>
            {
                projectPageViews.map(view => (
                    <div
                        key={view.type}
                        style={{padding: 10, cursor: 'pointer', background: currentView === view.type ? '#ddd' : 'white'}}
                        onClick={() => setRoute({page: 'project', projectId, tab: view.type})}
                    >
                        {view.label}
                    </div>
                ))
            }
        </div>
    )
}

type MainPanelProps = {
    width: number
    height: number
}

const MainPanel: FunctionComponent<MainPanelProps> = ({width, height}) => {
    const {projectId, files} = useProject()
    const {route} = useRoute()
    if (route.page !== 'project') throw Error(`Unexpected route ${JSON.stringify(route)}`)
    const currentView = (route.tab || 'project-home') as ProjectPageViewType

    const handleOpenInNeurosift = useCallback((filePaths: string[]) => {
        if (!files) {
            console.warn('No files')
            return
        }
        if (filePaths.length > 5) {
            alert('Too many files to open in Neurosift')
            return
        }

        const files2 = filePaths.map(filePath => {
            const file = files.find(file => file.fileName === filePath)
            if (!file) throw Error(`Unexpected: file not found: ${filePath}`)
            return file
        }, [files])

        openFilesInNeurosift(files2, projectId).then(() => {
            console.info('Opened in Neurosift')
        }, err => {
            console.warn(err)
            alert(`Problem opening in Neurosift: ${err.message}`)
        })
    }, [files, projectId])

    const [viewsThatHaveBeenVisible, setViewsThatHaveBeenVisible] = useState<ProjectPageViewType[]>([])
    useEffect(() => {
        if (!viewsThatHaveBeenVisible.includes(currentView)) {
            setViewsThatHaveBeenVisible(viewsThatHaveBeenVisible.concat([currentView]))
        }
    }, [currentView, viewsThatHaveBeenVisible])

    return (
        <div style={{position: 'absolute', width, height, overflow: 'hidden', background: 'white'}}>
            <div style={{position: 'absolute', width, height, visibility: currentView === 'project-home' ? undefined : 'hidden'}}>
                {
                    viewsThatHaveBeenVisible.includes('project-home') && (
                        <ProjectHome
                            width={width}
                            height={height}
                        />
                    )
                }
            </div>
            <div style={{position: 'absolute', width, height, visibility: currentView === 'project-files' ? undefined : 'hidden'}}>
                {
                    viewsThatHaveBeenVisible.includes('project-files') && (
                        <ProjectFiles
                            width={width}
                            height={height}
                            onOpenInNeurosift={handleOpenInNeurosift}
                        />
                    )
                }
            </div>
        </div>
    )
}

const StatusBar: FunctionComponent = () => {
    const {statusStrings} = useProject()
    const statusStringsSorted = useMemo(() => (statusStrings || []).sort((a, b) => a.localeCompare(b)), [statusStrings])
    return (
        <span>
            {statusStringsSorted.join(' ')}
        </span>
    )
}

export default ProjectPage