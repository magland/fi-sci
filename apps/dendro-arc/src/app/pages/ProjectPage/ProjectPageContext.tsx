/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FunctionComponent, PropsWithChildren, useCallback, useEffect, useMemo } from 'react';
import { deleteFile, deleteProject, fetchFiles, fetchProject, setProjectName, setProjectDescription } from '../../dbInterface/dbInterface';
import { useGithubAuth } from '../../GithubAuth/useGithubAuth';
import { DendroFile, DendroProject } from '../../types/dendro-types';
import { useDendro } from '../../DendroContext/DendroContext';

const queryParameters = new URLSearchParams(window.location.search)
const adminMode = queryParameters.get('admin') === '1'

type Props = {
    projectId: string
}

type OpenTabsState = {
    openTabs: {
        tabName: string
        content?: string
        editedContent?: string
    }[]
    currentTabName?: string
}

type OpenTabsAction = {
    type: 'openTab'
    tabName: string
} | {
    type: 'setTabContent'
    tabName: string
    content: string | undefined // undefined triggers a reload
} | {
    type: 'setTabEditedContent'
    tabName: string
    editedContent: string
} | {
    type: 'closeTab'
    tabName: string
} | {
    type: 'closeAllTabs'
} | {
    type: 'setCurrentTab'
    tabName: string
}

const openTabsReducer = (state: OpenTabsState, action: OpenTabsAction) => {
    switch (action.type) {
        case 'openTab':
            if (state.openTabs.find(x => x.tabName === action.tabName)) {
                return {
                    ...state,
                    currentTabName: action.tabName
                }
            }
            return {
                ...state,
                openTabs: [...state.openTabs, {tabName: action.tabName}],
                currentTabName: action.tabName
            }
        case 'setTabContent':
            return {
                ...state,
                openTabs: state.openTabs.map(x => {
                    if (x.tabName === action.tabName) {
                        return {
                            ...x,
                            content: action.content
                        }
                    }
                    return x
                })
            }
        case 'setTabEditedContent':
            return {
                ...state,
                openTabs: state.openTabs.map(x => {
                    if (x.tabName === action.tabName) {
                        return {
                            ...x,
                            editedContent: action.editedContent
                        }
                    }
                    return x
                })
            }
        case 'closeTab':
            if (!state.openTabs.find(x => x.tabName === action.tabName)) {
                return state
            }
            return {
                ...state,
                openTabs: state.openTabs.filter(x => x.tabName !== action.tabName),
                currentTabName: state.currentTabName === action.tabName ? state.openTabs[0]?.tabName : state.currentTabName
            }
        case 'closeAllTabs':
            return {
                ...state,
                openTabs: [],
                currentTabName: undefined
            }
        case 'setCurrentTab':
            if (!state.openTabs.find(x => x.tabName === action.tabName)) {
                return state
            }
            return {
                ...state,
                currentTabName: action.tabName
            }
    }
}

type ProjectPageContextType = {
    projectId: string
    project?: DendroProject
    files?: DendroFile[]
    // filesIncludingPending?: DendroFile[]
    openTabs: {
        tabName: string
        content?: string
        editedContent?: string
    }[]
    currentTabName?: string
    projectRole?: 'admin' | 'viewer' | 'none' | 'editor'
    openTab: (tabName: string) => void
    closeTab: (tabName: string) => void
    closeAllTabs: () => void
    setCurrentTab: (tabName: string) => void
    setTabContent: (tabName: string, content: string | undefined) => void
    setTabEditedContent: (tabName: string, editedContent: string) => void
    refreshFiles: () => void
    deleteProject: () => Promise<void>
    setProjectName: (name: string) => void
    setProjectDescription: (description: string) => Promise<void>
    deleteFile: (fileName: string) => Promise<void>
    fileHasBeenEdited: (fileName: string) => boolean
    refreshProject: () => void,
    statusStrings: string[]
}

const ProjectPageContext = React.createContext<ProjectPageContextType>({
    projectId: '',
    openTabs: [],
    currentTabName: undefined,
    openTab: () => {},
    closeTab: () => {},
    closeAllTabs: () => {},
    setCurrentTab: () => {},
    setTabContent: () => {},
    setTabEditedContent: () => {},
    refreshFiles: () => {},
    deleteProject: async () => {},
    setProjectName: () => {},
    setProjectDescription: async () => {},
    deleteFile: async () => {},
    fileHasBeenEdited: () => false,
    refreshProject: () => {},
    statusStrings: []
})

export const SetupProjectPage: FunctionComponent<PropsWithChildren<Props>> = ({children, projectId}) => {
    const {statusStrings, addStatusString, removeStatusString} = useStatusStrings()
    const [project, setProject] = React.useState<DendroProject | undefined>()
    const [files, setFiles] = React.useState<DendroFile[] | undefined>()
    const [refreshFilesCode, setRefreshFilesCode] = React.useState(0)
    const refreshFiles = useCallback(() => setRefreshFilesCode(rfc => rfc + 1), [])

    const [refreshProjectCode, setRefreshProjectCode] = React.useState(0)
    const refreshProject = useCallback(() => setRefreshProjectCode(rac => rac + 1), [])

    const [openTabs, openTabsDispatch] = React.useReducer(openTabsReducer, {openTabs: [], currentTabName: undefined})

    const auth = useGithubAuth()

    useEffect(() => {
        let canceled = false
        ;(async () => {
            // important not to set it to undefined
            // setProject(undefined)
            if (!projectId) return
            addStatusString('Loading project...')
            const project = await fetchProject(projectId, auth)
            if (canceled) return
            removeStatusString('Loading project...')
            setProject(project)
        })()
        return () => {canceled = true}
    }, [projectId, auth, refreshProjectCode, addStatusString, removeStatusString])

    useEffect(() => {
        let canceled = false
        ;(async () => {
            // setFiles(undefined)
            if (!projectId) return
            addStatusString('Loading files...')
            const af = await fetchFiles(projectId, auth)
            if (canceled) return
            removeStatusString('Loading files...')
            setFiles(af)
        })()
        return () => {canceled = true}
    }, [refreshFilesCode, projectId, auth, addStatusString, removeStatusString])

    const deleteProjectHandler = useMemo(() => (async () => {
        await deleteProject(projectId, auth)
    }), [projectId, auth])

    const setProjectNameHandler = useCallback(async (name: any) => {
        await setProjectName(projectId, name, auth)
        refreshProject()
    }, [projectId, refreshProject, auth])

    const setProjectDescriptionHandler = useCallback(async (description: any) => {
        await setProjectDescription(projectId, description, auth)
        refreshProject()
    }, [projectId, refreshProject, auth])

    const deleteFileHandler = useCallback(async (fileName: string) => {
        if (!project) return
        await deleteFile(projectId, fileName, auth)
    }, [project, projectId, auth])

    const fileHasBeenEdited = useMemo(() => ((fileName: string) => {
        const tab = openTabs.openTabs.find(x => x.tabName === `file:${fileName}`)
        if (!tab) return false
        return tab.editedContent !== tab.content
    }), [openTabs])

    const projectRole: 'admin' | 'viewer' | 'none' | 'editor' | undefined = useMemo(() => {
        if (!project) return undefined
        const userId = auth.userId || undefined
        if (userId) {
            if (adminMode) return 'admin'
            if (project.ownerId === userId) return 'admin'
            const user = project.users.find(user => user.userId === userId)
            if (user) {
                return user.role
            }
        }
        return project.publiclyReadable ? 'viewer' : 'none'
    }, [project, auth])

    const {reportLoadedProject} = useDendro()

    useEffect(() => {
        if (!project) return
        reportLoadedProject(project)
    }, [project, reportLoadedProject])

    const value: ProjectPageContextType = {
        projectId,
        project,
        files,
        // filesIncludingPending,
        openTabs: openTabs.openTabs,
        currentTabName: openTabs.currentTabName,
        projectRole,
        openTab: (tabName: string) => openTabsDispatch({type: 'openTab', tabName}),
        closeTab: (tabName: string) => openTabsDispatch({type: 'closeTab', tabName}),
        closeAllTabs: () => openTabsDispatch({type: 'closeAllTabs'}),
        setCurrentTab: (tabName: string) => openTabsDispatch({type: 'setCurrentTab', tabName}),
        setTabContent: (tabName: string, content: string | undefined) => openTabsDispatch({type: 'setTabContent', tabName, content}),
        setTabEditedContent: (tabName: string, editedContent: string) => openTabsDispatch({type: 'setTabEditedContent', tabName, editedContent}),
        refreshFiles,
        deleteProject: deleteProjectHandler,
        setProjectName: setProjectNameHandler,
        setProjectDescription: setProjectDescriptionHandler,
        deleteFile: deleteFileHandler,
        fileHasBeenEdited,
        refreshProject,
        statusStrings
    }

    return (
        <ProjectPageContext.Provider value={value}>
            {children}
        </ProjectPageContext.Provider>
    )
}

type StatusStringsAction = {
    type: 'add'
    statusString: string
} | {
    type: 'remove'
    statusString: string
}

const statusStringsReducer = (state: string[], action: StatusStringsAction) => {
    switch (action.type) {
        case 'add':
            return [...state, action.statusString]
        case 'remove':
            return state.filter(s => s !== action.statusString)
    }
}

const useStatusStrings = () => {
    const [statusStrings, dispatch] = React.useReducer(statusStringsReducer, [])
    const addStatusString = useCallback((statusString: string) => {
        dispatch({type: 'add', statusString})
    }, [])
    const removeStatusString = useCallback((statusString: string) => {
        dispatch({type: 'remove', statusString})
    }, [])
    return {statusStrings, addStatusString, removeStatusString}
}

export const useProject = () => {
    const context = React.useContext(ProjectPageContext)
    return context
}