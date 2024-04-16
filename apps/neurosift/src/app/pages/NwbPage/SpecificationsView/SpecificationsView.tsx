/* eslint-disable @typescript-eslint/no-explicit-any */
import { FunctionComponent } from "react"
import { useNwbFileSpecifications } from "./SetupNwbFileSpecificationsProvider"

type SpecificationsViewProps = {
    width: number
    height: number
}

const SpecificationsView: FunctionComponent<SpecificationsViewProps> = ({ width, height }) => {
    const specifications = useNwbFileSpecifications()
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
                    {specifications?.allNamespaces?.map((ns, i) => (
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
                    {specifications?.allDatasets?.map((ds, i) => (
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
                    {specifications?.allGroups?.map((g, i) => (
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

export default SpecificationsView