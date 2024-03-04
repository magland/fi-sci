import { MergedRemoteH5File, RemoteH5File, RemoteH5FileX } from "@fi-sci/remote-h5-file"
import { ToggleButton, ToggleButtonGroup } from "@mui/material"
import { FunctionComponent, useEffect, useState } from "react"
import BrowseNwbView from "../BrowseNwbView/BrowseNwbView"
import DendroView from "../DendroView/DendroView"
import DefaultNwbFileView from "./DefaultNwbFileView"
import useNeurosiftAnnotations from "../../../NeurosiftAnnotations/useNeurosiftAnnotations"
import NeurosiftAnnotationsView from "../NeurosiftAnnotationsView/NeurosiftAnnotationsView"

type Props = {
    width: number
    height: number
    nwbFile: RemoteH5FileX
}

type ViewMode = 'default' | 'raw' | 'dendro' | 'annotations'

const NwbMainViewMainPanel: FunctionComponent<Props> = ({ width, height, nwbFile }) => {
    const topBarHeight = 50

    const [viewMode, setViewMode] = useState<ViewMode>('default')

    const [hasBeenVisibleViewModes, setHasBeenVisibleViewModes] = useState<ViewMode[]>([])
    useEffect(() => {
        if (!hasBeenVisibleViewModes.includes(viewMode)) {
            setHasBeenVisibleViewModes([...hasBeenVisibleViewModes, viewMode])
        }
    }, [viewMode, hasBeenVisibleViewModes])

    return (
        <div style={{ position: 'absolute', width, height }}>
            <div style={{ position: 'absolute', width, height: topBarHeight, paddingLeft: 10}}>
                <ViewModeToggleButton viewMode={viewMode} setViewMode={setViewMode} />
            </div>
            {/* Important to use undefined rather than visible so that the hidden value is respected for parent components */}
            <div style={{ position: 'absolute', width, height: height - topBarHeight, top: topBarHeight, visibility: viewMode === 'default' ? undefined : 'hidden' }}>
                {hasBeenVisibleViewModes.includes('default') && (
                    <DefaultNwbFileView
                        width={width}
                        height={height - topBarHeight}
                        nwbFile={nwbFile}
                    />
                )}
            </div>
            <div style={{ position: 'absolute', width, height: height - topBarHeight, top: topBarHeight, visibility: viewMode === 'raw' ? undefined : 'hidden' }}>
                {hasBeenVisibleViewModes.includes('raw') && (
                    <BrowseNwbView
                        width={width}
                        height={height - topBarHeight}
                    />
                )}
            </div>
            <div style={{ position: 'absolute', width, height: height - topBarHeight, top: topBarHeight, visibility: viewMode === 'dendro' ? undefined : 'hidden' }}>
                {hasBeenVisibleViewModes.includes('dendro') && (
                    <DendroView
                        width={width}
                        height={height - topBarHeight}
                    />
                )}
            </div>
            <div style={{ position: 'absolute', width, height: height - topBarHeight, top: topBarHeight, visibility: viewMode === 'annotations' ? undefined : 'hidden' }}>
                {hasBeenVisibleViewModes.includes('annotations') && (
                    <div>
                        <NeurosiftAnnotationsView
                            width={width}
                            height={height - topBarHeight}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}

type ViewModeToggleButtonProps = {
    viewMode: ViewMode
    setViewMode: (mode: ViewMode) => void
}

const ViewModeToggleButton: FunctionComponent<ViewModeToggleButtonProps> = ({ viewMode, setViewMode }) => {
    const handleChange = (
        event: React.MouseEvent<HTMLElement>,
        newViewMode: string
    ) => {
        if (!newViewMode) return
        setViewMode(newViewMode as ViewMode)
    }
    const {neurosiftAnnotationsAccessToken} = useNeurosiftAnnotations()
    return (
        <ToggleButtonGroup
            color="primary"
            value={viewMode}
            exclusive
            onChange={handleChange}
            aria-label="Platform"
        >
            <ToggleButton value="default">Default</ToggleButton>
            <ToggleButton value="raw">Raw</ToggleButton>
            <ToggleButton value="dendro">Dendro</ToggleButton>
            {
                neurosiftAnnotationsAccessToken && <ToggleButton value="annotations">Annotations</ToggleButton>
            }
        </ToggleButtonGroup>
    )
}

export default NwbMainViewMainPanel