/* eslint-disable @typescript-eslint/no-explicit-any */
import { RemoteH5FileX } from "@fi-sci/remote-h5-file"
import { FunctionComponent, useEffect, useMemo, useState } from "react"
import { useNwbFile } from "../NwbFileContext"

type SpecificationsViewProps = {
    width: number
    height: number
}

const SpecificationsView: FunctionComponent<SpecificationsViewProps> = ({ width, height }) => {
    const nwbFile = useNwbFile()
    const [subgroups, setSubgroups] = useState<SpecificationsSubgroup[] | undefined>(undefined)
    useEffect(() => {
        let canceled = false
        ;(async () => {
            if (!nwbFile) return
            try {
                const c = await loadSpecificationsSubgroups(nwbFile)
                console.log('SPECIFICATIONS')
                console.log(c)
                if (canceled) return
                setSubgroups(c)
            }
            catch (e) {
                console.error(e)
                console.error('Error creating SpecificationsClient')
            }
        })()
        return () => { canceled = true }
    }, [nwbFile])
    const subgroupsOnlyHighestVersions = useMemo(() => {
        const x: SpecificationsSubgroup[] = []
        for (const sg of subgroups || []) {
            const versions = sg.versions
            if (versions.length > 1) {
                const highestVersion = getHighestVersion(versions, sg.name)
                x.push({ name: sg.name, versions: [highestVersion] })
            }
            else {
                x.push(sg)
            }
        }
        return x
    }, [subgroups])
    const allNamespaces: SpecificationsNamespace[] | undefined = useMemo(() => {
        if (!subgroupsOnlyHighestVersions) return undefined
        const all: SpecificationsNamespace[] = []
        for (const sg of subgroupsOnlyHighestVersions) {
            for (const sv of sg.versions) {
                for (const item of sv.items) {
                    if (item.value.namespaces) {
                        all.push(...item.value.namespaces)
                    }
                }
            }
        }
        return all
    }, [subgroupsOnlyHighestVersions])
    const allDatasets: SpecificationsDataset[] | undefined = useMemo(() => {
        if (!subgroupsOnlyHighestVersions) return undefined
        const all: SpecificationsDataset[] = []
        for (const sg of subgroupsOnlyHighestVersions) {
            for (const sv of sg.versions) {
                for (const item of sv.items) {
                    if (item.value.datasets) {
                        all.push(...item.value.datasets)
                    }
                }
            }
        }
        return all
    }, [subgroupsOnlyHighestVersions])
    const allGroups: SpecificationsGroup[] | undefined = useMemo(() => {
        if (!subgroupsOnlyHighestVersions) return undefined
        const all: SpecificationsGroup[] = []
        for (const sg of subgroupsOnlyHighestVersions) {
            for (const sv of sg.versions) {
                for (const item of sv.items) {
                    if (item.value.groups) {
                        all.push(...item.value.groups)
                    }
                }
            }
        }
        return all
    }, [subgroupsOnlyHighestVersions])
    return (
        <div style={{position: 'absolute', width, height, overflowY: 'auto'}}>
            <h3>Namespaces</h3>
            <table className="nwb-table">
                <thead>
                    <tr>
                        <th>Namespace</th>
                        <th>Version</th>
                        <th>Author</th>
                        <th>Contact</th>
                        <th>Doc</th>
                        <th>Full Name</th>
                        <th>Schema</th>
                    </tr>
                </thead>
                <tbody>
                    {allNamespaces?.map((ns, i) => (
                        <tr key={i}>
                            <td>{ns.name}</td>
                            <td>{ns.version}</td>
                            <td>{typeof ns.author === 'string' ? ns.author : ns.author.join(', ')}</td>
                            <td>{typeof ns.contact === 'string' ? ns.contact : ns.contact.join(', ')}</td>
                            <td>{abbr(ns.doc)}</td>
                            <td>{ns.full_name}</td>
                            <td>{ns.schema.map(s => 'namespace' in s ? s.namespace : 'source' in s ? s.source : '').join(', ')}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <h3>Datasets</h3>
            <table className="nwb-table">
                <thead>
                    <tr>
                        <th>neurodata_type_def</th>
                        <th>neurodata_type_inc</th>
                        <th>dtype</th>
                        <th>dims</th>
                        <th>attributes</th>
                    </tr>
                </thead>
                <tbody>
                    {allDatasets?.map((ds, i) => (
                        <tr key={i}>
                            <td>{ds.neurodata_type_def}</td>
                            <td>{ds.neurodata_type_inc}</td>
                            <td>{abbr(JSON.stringify(ds.dtype))}</td>
                            <td>{abbr(JSON.stringify(ds.dims))}</td>
                            <td>{abbr(JSON.stringify(ds.attributes))}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <h3>Groups</h3>
            <table className="nwb-table">
                <thead>
                    <tr>
                        <th>neurodata_type_def</th>
                        <th>neurodata_type_inc</th>
                        <th>default_name</th>
                        <th>doc</th>
                        <th>datasets</th>
                        <th>groups</th>
                    </tr>
                </thead>
                <tbody>
                    {allGroups?.map((g, i) => (
                        <tr key={i}>
                            <td>{g.neurodata_type_def}</td>
                            <td>{g.neurodata_type_inc}</td>
                            <td>{g.default_name}</td>
                            <td>{abbr(g.doc)}</td>
                            <td>{abbr(JSON.stringify(g.datasets))}</td>
                            <td>{abbr(JSON.stringify(g.groups))}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

const abbr = (s: string) => abbreviate(s, 60)

const abbreviate = (s: string, maxLength: number) => {
    if (!s) return ''
    if (s.length <= maxLength) return s
    return s.slice(0, maxLength - 3) + '...'
}

type SpecificationsSubgroup = {
    name: string
    versions: SpecificationsSubgroupVersion[]
}

type SpecificationsSubgroupVersion = {
    version: string
    items: SpecificationsItem[]
}

type SpecificationsItem = {
    name: string
    value: SpecificationsItemValue
}

type SpecificationsItemValue = {
    namespaces?: SpecificationsNamespace[]
    datasets?: SpecificationsDataset[]
    groups?: SpecificationsGroup[]
}

type SpecificationsNamespace = {
    author: string | string[]
    contact: string | string[]
    doc: string
    full_name: string
    name: string
    schema: SpecificationsNamespaceSchema[]
    version: string
}

type SpecificationsDataset = {
    doc: string
    neurodata_type_def: string
    neurodata_type_inc?: string
    dtype?: any
    dims?: any
    attributes?: any
}

type SpecificationsGroup = {
    doc: string
    default_name: string
    neurodata_type_def: string
    neurodata_type_inc?: string
    datasets?: any[]
    groups?: any[]
}

type SpecificationsNamespaceSchema = {
    namespace: string
} | {
    source: string
}

const getHighestVersion = (versions: SpecificationsSubgroupVersion[], label: string) => {
    let highestVersion = versions[0]
    for (const version of versions) {
        if (compareVersions(version.version, highestVersion.version) > 0) {
            highestVersion = version
        }
    }
    console.info(`${label}: Using highest version ${highestVersion.version} for ${versions.map(v => v.version).join(', ')}`)
    return highestVersion
}

const compareVersions = (a: string, b: string) => {
    // for example 0.3.9-alpha and 0.3.9 and 1.2.0 and 1.3.5-alpha and 1.3.5-beta2
    const aParts = a.split('.')
    const bParts = b.split('.')
    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        const aPart = i < aParts.length ? aParts[i] : '0'
        const bPart = i < bParts.length ? bParts[i] : '0'
        const aDashInd = aPart.indexOf('-')
        const bDashInd = bPart.indexOf('-')
        const aVersion = aDashInd >= 0 ? aPart.slice(0, aDashInd) : aPart
        const bVersion = bDashInd >= 0 ? bPart.slice(0, bDashInd) : bPart
        const aAlpha = aDashInd >= 0 ? aPart.slice(aDashInd + 1) : ''
        const bAlpha = bDashInd >= 0 ? bPart.slice(bDashInd + 1) : ''
        const aVersionNum = parseInt(aVersion)
        const bVersionNum = parseInt(bVersion)
        if (aVersionNum < bVersionNum) return -1
        if (aVersionNum > bVersionNum) return 1
        if (aAlpha < bAlpha) return -1
        if (aAlpha > bAlpha) return 1
    }
    return 0
}

const loadSpecificationsSubgroups = async (nwbFile: RemoteH5FileX) => {
    const namespaces: SpecificationsSubgroup[] = []
    const s = await nwbFile.getGroup('/specifications')
    if (!s) throw Error('No specifications group')
    for (const sg of s.subgroups) {
        const A: SpecificationsSubgroup = { name: sg.name, versions: [] }
        const x = await nwbFile.getGroup(`/specifications/${sg.name}`)
        if (!x) throw Error(`No specifications/${sg.name} group`)
        for (const vx of x.subgroups) {
            const B: SpecificationsSubgroupVersion = { version: vx.name, items: [] }
            const y = await nwbFile.getGroup(`/specifications/${sg.name}/${vx.name}`)
            if (!y) throw Error(`No specifications/${sg.name}/${vx.name} group`)
            for (const itemDataset of y.datasets) {
                const data = await nwbFile.getDatasetData(`/specifications/${sg.name}/${vx.name}/${itemDataset.name}`, {})
                if (!data) throw Error(`No data for /specifications/${sg.name}/${vx.name}/${itemDataset.name}`)
                if (!(typeof data === 'string')) throw Error(`Data for /specifications/${sg.name}/${vx.name}/${itemDataset.name} is not a string`)
                const value = JSON.parse(data)
                B.items.push({ name: itemDataset.name, value })
            }
            A.versions.push(B)
        }
        namespaces.push(A)
    }
    return namespaces
}

export default SpecificationsView