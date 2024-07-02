import { FunctionComponent, useEffect, useMemo, useState } from "react"
import viewPlugins, { ViewPlugin, findViewPluginsForType } from "../viewPlugins/viewPlugins"
import { useNwbFile } from "../NwbFileContext"
import { RemoteH5FileX, RemoteH5Group } from "@fi-sci/remote-h5-file"
import { Hyperlink } from "@fi-sci/misc"
import { useNwbOpenTabs } from "../NwbOpenTabsContext"
import { useNwbFileSpecifications } from "../SpecificationsView/SetupNwbFileSpecificationsProvider"

type WidgetsViewProps = {
    width: number
    height: number
}

const WidgetsView: FunctionComponent<WidgetsViewProps> = ({ width, height }) => {
    const nwbFile = useNwbFile()
    const specifications = useNwbFileSpecifications()
    const [neurodataObjects, setNeurodataObjects] = useState<{
        group: RemoteH5Group,
        viewPlugins: ViewPlugin[]
        defaultViewPlugin: ViewPlugin | undefined
    }[]>([])
    const { openTab } = useNwbOpenTabs()
    useEffect(() => {
        let canceled = false;
        (async () => {
            setNeurodataObjects([])
            const findNeurodataObjectsInGroup = async (group: RemoteH5Group) => {
                const ret: RemoteH5Group[] = []
                if (group.attrs.neurodata_type) {
                    ret.push(group)
                }
                for (const subgroup of group.subgroups) {
                    const grp = await nwbFile.getGroup(joinPaths(group.path, subgroup.name))
                    if (!grp) continue;
                    const x = await findNeurodataObjectsInGroup(grp)
                    ret.push(...x)
                }
                return ret
            }
            const rootGroup = await nwbFile.getGroup('/')
            if (canceled) return;
            if (!rootGroup) return;
            const objectGroups = await findNeurodataObjectsInGroup(rootGroup)
            const objects: {
                group: RemoteH5Group,
                viewPlugins: ViewPlugin[],
                defaultViewPlugin: ViewPlugin | undefined
            }[] = []
            for (const objectGroup of objectGroups) {
                const { viewPlugins, defaultViewPlugin } = findViewPluginsForType(
                    objectGroup.attrs.neurodata_type || '',
                    { nwbFile },
                    specifications
                )
                const viewPluginsEnabled: ViewPlugin[] = []
                for (const vp of viewPlugins) {
                    if (vp.checkEnabled) {
                        if (await vp.checkEnabled(nwbFile, objectGroup.path)) {
                            viewPluginsEnabled.push(vp)
                        }
                    }
                    else {
                        viewPluginsEnabled.push(vp)
                    }
                }
                objects.push({
                    group: objectGroup,
                    viewPlugins: viewPluginsEnabled,
                    defaultViewPlugin
                })
            }
            setNeurodataObjects(objects)
        })()
        return () => { canceled = true }
    }, [nwbFile, specifications])
    return (
        <div style={{ position: 'absolute', width, height, backgroundColor: '#fff', overflowY: 'auto' }}>
            <div style={{ padding: 20 }}>
                {
                    viewPlugins.map((plugin, i) => (
                        <ViewPluginView
                            plugin={plugin}
                            nwbFile={nwbFile}
                            neurodataObjects={neurodataObjects}
                            onOpenTab={openTab}
                            key={i}
                        />
                    ))
                }
            </div>
        </div>
    )
}

type ViewPluginViewProps = {
    plugin: ViewPlugin
    nwbFile: RemoteH5FileX
    neurodataObjects: {
        group: RemoteH5Group,
        viewPlugins: ViewPlugin[],
        defaultViewPlugin: ViewPlugin | undefined
    }[]
    onOpenTab: (x: string) => void
}

const ViewPluginView: FunctionComponent<ViewPluginViewProps> = ({ plugin, neurodataObjects, onOpenTab }) => {
    const items = useMemo(() => {
        const ret: {
            label: string
            itemTabString: string
        }[] = []
        for (const neurodataObject of neurodataObjects) {
            neurodataObject.viewPlugins.forEach(vp => {
                if (vp.name === plugin.name) {
                    if (plugin.name === neurodataObject.defaultViewPlugin?.name) {
                        ret.push({
                            label: neurodataObject.group.path,
                            itemTabString: `neurodata-item:${neurodataObject.group.path}|${neurodataObject.group.attrs.neurodata_type}`
                        })
                    }
                    else {
                        ret.push({
                            label: neurodataObject.group.path,
                            itemTabString: `view:${plugin.name}|${neurodataObject.group.path}`
                        })
                    }
                }
            })
        }
        return ret
    }, [plugin, neurodataObjects])
    const [expanded, setExpanded] = useState(false)
    const doDisplay = items.length > 0
    if (!doDisplay) return <span />
    return (
        <div>
            <div
                style={{cursor: 'pointer', padding: 10, marginTop: 10, background: expanded ? '#336' : '#aac', color: expanded ? '#fff' : '#000', border: 'solid 1px black'}}
                onClick={() => setExpanded(!expanded)}
            >
                {expanded ? '▼' : '►'} {plugin.name}{plugin.usesPairio ? '*' : ''} ({items.length})
            </div>
            {
                expanded && (
                    <>{
                        items.map((item, i) => (
                            <div style={{marginLeft: 10}}>
                                <Hyperlink
                                    onClick={() => {
                                        onOpenTab(item.itemTabString)
                                    }}
                                    color={plugin.usesPairio ? 'darkgreen' : undefined}
                                >
                                    {item.label}
                                </Hyperlink>
                            </div>
                        ))

                    }</>
                )
            }
        </div>
    )
}

const joinPaths = (a: string, b: string) => {
    if (a.endsWith('/')) return a + b
    return a + '/' + b
}

export default WidgetsView