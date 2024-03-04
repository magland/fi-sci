import { RemoteH5FileX, RemoteH5Group } from "@fi-sci/remote-h5-file"
import { FunctionComponent, useEffect, useMemo, useState } from "react"
import TopLevelGroupContentPanel from "../BrowseNwbView/TopLevelGroupContentPanel"
import IntervalsContentPanel from "./IntervalsContentPanel"
import { useGroup } from "./NwbMainView"
import ProcessingGroupContentPanel from "./ProcessingGroupContentPanel"
import UnitsContentPanel from "./UnitsContentPanel"

type Props = {
    width: number
    height: number
    nwbFile: RemoteH5FileX
}

type Heading = {
    name: string
    label: string
    groupPath: string
}

const DefaultNwbFileView: FunctionComponent<Props> = ({width, height, nwbFile}) => {
    const rootGroup = useGroup(nwbFile, '/')
    const processingGroup = useGroup(nwbFile, '/processing')
    const headings = useMemo(() => {
        const hh: Heading[] = []
        hh.push({
            name: 'acquisition',
            label: 'acquisition',
            groupPath: '/acquisition'
        })
        if (processingGroup) {
            processingGroup.subgroups.forEach(sg => {
                hh.push({
                    name: `processing/${sg.name}`,
                    label: `processing/${sg.name}`,
                    groupPath: `/processing/${sg.name}`
                })
            })
        }
        else {
            hh.push({
                name: 'loading-processing',
                label: 'loading processing...',
                groupPath: ''
            })
        }
        hh.push({
            name: 'units',
            label: 'units',
            groupPath: '/units'
        })
        if (rootGroup) {
            for (const sg of rootGroup.subgroups) {
                if (sg.name === 'processing') {
                    continue
                }
                if (!hh.find(h => (h.groupPath === sg.path))) {
                    hh.push({
                        name: sg.name,
                        label: sg.name,
                        groupPath: sg.path
                    })
                }
            }
        }
        hh.sort((a, b) => {
            if (a.name < b.name) return -1
            if (a.name > b.name) return 1
            return 0
        })
        return hh
    }, [processingGroup, rootGroup])
    return (
        <div style={{position: 'absolute', width, height, overflowY: 'auto'}}>
            {/* <DendroLinksView /> */}
            {
                headings.map((heading) => (
                    <TopLevelHeadingView
                        key={heading.name}
                        nwbFile={nwbFile}
                        heading={heading}
                        width={width}
                    />
                ))
            }
        </div>
    )
}

type TopLevelHeadingViewProps = {
    nwbFile: RemoteH5FileX
    heading: Heading
    width: number
}

const TopLevelHeadingView: FunctionComponent<TopLevelHeadingViewProps> = ({nwbFile, heading, width}) => {
    const [expanded, setExpanded] = useState(false)
    const group = useGroup(nwbFile, heading.groupPath)
    // const titlePanelColor = expanded ? '#336' : '#669'
    const titlePanelColor = expanded ? '#a67c00' : '#feb'
    const titleColor = expanded ? '#feb' : '#865c00'
    const expandable = !!heading.groupPath
    return (
        <div style={{marginLeft: 10}}>
            <div
                style={{cursor: 'pointer', paddingTop: 10, paddingBottom: 10, marginTop: 10, background: titlePanelColor, color: titleColor, border: 'solid 1px black'}}
                onClick={() => setExpanded(!expanded)}
            >
                {expandable ? (expanded ? '▼' : '►') : <span>&nbsp;</span>} {heading.label} <TopLevelTitlePanelText heading={heading} group={group} nwbFile={nwbFile} />
            </div>
            {
                expanded && group && (
                    <TopLevelContentPanel heading={heading} group={group} nwbFile={nwbFile} width={width - 10} />
                )
            }
        </div>
    )
}

type TopLevelTitlePanelTextProps = {
    heading: Heading
    group: RemoteH5Group | undefined
    nwbFile: RemoteH5FileX
}

const TopLevelTitlePanelText: FunctionComponent<TopLevelTitlePanelTextProps> = ({heading, group, nwbFile}) => {
    if (!group) return <span>-</span>
    if (heading.name === 'units') {
        return <UnitsTitlePanelText heading={heading} group={group} nwbFile={nwbFile} />
    }
    else {
        return <span>({group.subgroups.length + group.datasets.length})</span>
    }
}

const UnitsTitlePanelText: FunctionComponent<TopLevelTitlePanelTextProps> = ({group, nwbFile}) => {
    const [numUnits, setNumUnits] = useState<number | undefined>(undefined)
    useEffect(() => {
        if (!group) return
        if (group.datasets.filter(ds => (ds.name === 'id')).length === 0) return
        let canceled = false
        const load = async () => {
            const ids = await nwbFile.getDatasetData(`${group.path}/id`, {})
            if (canceled) return
            if (!ids) return
            setNumUnits(ids.length)
        }
        load()
        return () => {canceled = true}
    }, [group, nwbFile])
    if (numUnits === undefined) return <span>...</span>
    return <span>({numUnits} units)</span>
}

type TopLevelContentPanelProps = {
    heading: Heading
    group: RemoteH5Group
    nwbFile: RemoteH5FileX
    width: number
}

const TopLevelContentPanel: FunctionComponent<TopLevelContentPanelProps> = ({heading, group, nwbFile, width}) => {
    const name = heading.name
    if (name === 'units') {
        return <UnitsContentPanel nwbFile={nwbFile} group={group} width={width} />
    }
    else if (name === 'acquisition') {
        return <ProcessingGroupContentPanel nwbFile={nwbFile} groupPath={heading.groupPath} />
    }
    else if (name.startsWith('processing/')) {
        return <ProcessingGroupContentPanel nwbFile={nwbFile} groupPath={heading.groupPath} />
    }
    else if (name === 'intervals') {
        return <IntervalsContentPanel nwbFile={nwbFile} group={group} />
    }
    return (
        <TopLevelGroupContentPanel
            name={name}
            group={group}
            nwbFile={nwbFile}
        />
    )
}

export default DefaultNwbFileView