/* eslint-disable @typescript-eslint/no-explicit-any */
import { FunctionComponent, useCallback, useEffect, useMemo, useReducer, useState } from "react"
import { valueToElement } from "../../BrowseNwbView/BrowseNwbView"
import { useNwbFile } from "../../NwbFileContext"
import { useGroup } from "../../NwbMainView/NwbMainView"
import { SmallIconButton } from "@fi-sci/misc"
import { Download, Help } from "@mui/icons-material"
import ModalWindow, { useModalWindow } from "@fi-sci/modal-window"
import DynamicTableColumnInfoView from "./DynamicTableColumnInfoView"
import { DatasetDataType } from "@fi-sci/remote-h5-file"

type Props = {
    width: number
    height: number
    path: string
    condensed?: boolean
    referenceColumnName?: string // for example, 'id'
}

type DataState = {
    [key: string]: any[]
}
type DataAction = {
    type: 'set'
    key: string
    data: any[]
}
const dataReducer = (state: DataState, action: DataAction) => {
    if (action.type === 'set') {
        return {
            ...state,
            [action.key]: action.data
        }
    }
    else return state
}

type ColumnSortState = {
    primary?: {
        column: string
        ascending: boolean
    }
    secondary?: {
        column: string
        ascending: boolean
    }
}

type ColumnSortAction = {
    type: 'click'
    column: string
}

const columnSortReducer = (state: ColumnSortState, action: ColumnSortAction): ColumnSortState => {
    if (action.type === 'click') {
        if (state.primary) {
            // the primary column is already set
            if (state.primary.column === action.column) {
                // the primary column is the same as the one that was clicked
                return {
                    ...state,
                    primary: {
                        ...state.primary,
                        ascending: !state.primary.ascending // switch the sort order
                    }
                }
            }
            else {
                // the primary column becomes the secondary column
                return {
                    ...state,
                    secondary: state.primary,
                    primary: {
                        column: action.column,
                        ascending: true
                    }
                }
            }
        }
        else {
            // the primary column is not set
            return {
                ...state,
                primary: {
                    column: action.column,
                    ascending: true
                }
            }
        }
    }
    else return state
}

type ColumnDescriptions = {
    [colname: string]: string
}

type ColumnDescriptionAction = {
    type: 'set'
    column: string
    description: string
}

const columnDescriptionReducer = (state: ColumnDescriptions, action: ColumnDescriptionAction): ColumnDescriptions => {
    if (action.type === 'set') {
        return {
            ...state,
            [action.column]: action.description
        }
    }
    else return state
}

const DynamicTableView: FunctionComponent<Props> = ({ width, height, path, referenceColumnName }) => {
    const nwbFile = useNwbFile()
    if (!nwbFile) throw Error('Unexpected: nwbFile is null')
    const [data, dataDispatch] = useReducer(dataReducer, {})
    const group = useGroup(nwbFile, path)
    const [columnSortState, columnSortDispatch] = useReducer(columnSortReducer, {})
    const colnames = useMemo(() => {
        if (!group) return undefined
        let c = group.attrs['colnames'] as string[]
        if (!c) return undefined
        const idDataset = group.datasets.find(ds => (ds.name === 'id'))
        if (idDataset) {
            c = c.filter(name => {
                const ds = group.datasets.find(ds => (ds.name === name))
                if ((ds) && (ds.shape[0] !== idDataset.shape[0])) {
                    // for example, event_times, event_amplitudes
                    return false
                }
                return true
            })
        }
        if (!c.includes('id')) {
            if (group.datasets.find(ds => (ds.name === 'id'))) {
                c = ['id', ...c]
            }
        }
        // const nt = group.attrs['neurodata_type']
        // if (nt === 'Units') {
        //     c = c.filter(name => (name !== 'spike_times'))
        //     if (!c.includes('id')) {
        //         c = ['id', ...c]
        //     }
        // }
        return c
    }, [group])
    const [loading, setLoading] = useState(false)
    useEffect(() => {
        let canceled = false
        const load = async () => {
            if (!colnames) return
            setLoading(true)
            for (const colname of colnames) {
                const ds0 = await nwbFile.getDataset(path + '/' + colname)
                if (!ds0) {
                    console.warn(`In DynamicTableView, dataset not found: ${path}/${colname}`)
                    continue
                }
                let d: DatasetDataType | any[] | undefined = await nwbFile.getDatasetData(path + '/' + colname, {})
                if (canceled) return
                if (!d) {
                    console.warn(`In DynamicTableView, dataset data not found: ${path}/${colname}`)
                    continue
                }

                // See https://github.com/dandi/helpdesk/discussions/131 - that's why we squeeze
                const squeezedShape = ds0 ? (ds0.shape.length > 1 ? ds0.shape.filter((s: number) => s > 1) : ds0.shape) : []
                if (squeezedShape.length !== 1) {
                    if (squeezedShape.length === 2) {
                        // in this case we are going to reshape the data
                        // See: https://github.com/flatironinstitute/neurosift/issues/173
                        const newD: any[][] = []
                        for (let i = 0; i < squeezedShape[0]; i++) {
                            const entry = []
                            for (let j = 0; j < squeezedShape[1]; j++) {
                                entry.push(d[i * squeezedShape[1] + j])
                            }
                            newD.push(entry)
                        }
                        d = newD
                    }
                    else {
                        console.warn(`In DynamicTableView, unexpected shape for ${path}/${colname}`, ds0.shape)
                        continue
                    }
                }

                /* handle special case where dtype is unknown and we have the wrong number of elements */
                if (ds0.shape.length === 1) {
                    if (ds0.shape[0] !== d.length) {
                        const factor = d.length / ds0.shape[0]
                        // check if factor is a perfect integer
                        if (factor === Math.floor(factor)) {
                            const d2 = []
                            for (let i = 0; i < ds0.shape[0]; i++) {
                                d2.push(d.slice(i * factor, (i + 1) * factor))
                            }
                            d = d2 as any
                        }
                    }
                }
                dataDispatch({type: 'set', key: colname, data: Array.from(d as any)})
            }
            setLoading(false)
        }
        load()
        return () => {canceled = true}
    }, [colnames, nwbFile, path])

    const validColumnNames = useMemo(() => {
        if (!colnames) return undefined
        const referenceColumnData = referenceColumnName ? data[referenceColumnName] : undefined
        const ret: string[] = []
        for (const colname of colnames) {
            const d = data[colname]
            if (d) {
                if ((referenceColumnData) && (d.length !== referenceColumnData.length)) {
                    console.warn(`In DynamicTableView, unexpected length for ${path}/${colname}`, d.length, referenceColumnData.length)
                    continue
                }
                ret.push(colname)
            }
        }
        return ret
    }, [colnames, data, path, referenceColumnName])

    const rowItems: {columnValues: any[]}[] = useMemo(() => {
        if (!colnames) return []
        let numRows = 0
        for (const colname of colnames) {
            const d = data[colname]
            if (d) {
                numRows = Math.max(numRows, d.length)
            }
        }
        const ret: {columnValues: any[]}[] = []
        for (let i = 0; i < numRows; i++) {
            const row: {columnValues: any[]} = {columnValues: []}
            for (const colname of colnames) {
                const d = data[colname]
                if (d) {
                    row.columnValues.push(d[i])
                }
                else {
                    row.columnValues.push(undefined)
                }
            }
            ret.push(row)
        }
        return ret
    }, [colnames, data])

    const sortedRowItems = useMemo(() => {
        if (!validColumnNames) return rowItems
        const primary = columnSortState.primary
        const secondary = columnSortState.secondary
        if (!primary) return rowItems
        const primaryColIndex = validColumnNames.indexOf(primary.column)
        if (primaryColIndex < 0) return rowItems
        const secondaryColIndex = secondary ? validColumnNames.indexOf(secondary.column) : -1
        const ret = [...rowItems]
        ret.sort((a, b) => {
            const valA = a.columnValues[primaryColIndex]
            const valB = b.columnValues[primaryColIndex]
            if (valA === undefined) return 1
            if (valB === undefined) return -1
            if (valA < valB) return primary.ascending ? -1 : 1
            if (valA > valB) return primary.ascending ? 1 : -1
            if ((secondaryColIndex >= 0) && (secondary)) {
                const valA2 = a.columnValues[secondaryColIndex]
                const valB2 = b.columnValues[secondaryColIndex]
                if (valA2 === undefined) return 1
                if (valB2 === undefined) return -1
                if (valA2 < valB2) return secondary.ascending ? -1 : 1
                if (valA2 > valB2) return secondary.ascending ? 1 : -1
            }
            return 0
        })
        return ret
    }, [validColumnNames, rowItems, columnSortState])

    const [columnDescriptions, columnDescriptionDispatch] = useReducer(columnDescriptionReducer, {})
    useEffect(() => {
        if (!group) return
        for (const colname of colnames || []) {
            const ds = group.datasets.find(ds => (ds.name === colname))
            if (ds) {
                columnDescriptionDispatch({type: 'set', column: colname, description: ds.attrs.description || ''})
            }
        }
    }, [colnames, group])

    const sortedRowItemsAbbreviated = useMemo(() => {
        const maxLength = 20_000 / (colnames?.length || 1)
        if (sortedRowItems.length < maxLength) {
            return sortedRowItems
        }
        const ret = []
        for (let i = 0; i < maxLength; i++) {
            ret.push(sortedRowItems[i])
        }
        return ret
    }, [sortedRowItems, colnames])

    const handleExportAsCsv = useCallback(() => {
        if (!validColumnNames) return
        const lines: string[] = []
        lines.push(validColumnNames.join(','))
        for (const rowItem of sortedRowItems) {
            const line = validColumnNames.map((colname) => {
                const val = rowItem.columnValues[validColumnNames.indexOf(colname)]
                if (val === undefined) return ''
                if (typeof val === 'string') {
                    return `"${val.replace(/"/g, '""')}"`
                }
                return val
            }).join(',')
            lines.push(line)
        }
        const csv = lines.join('\n')
        const blob = new Blob([csv], {type: 'text/csv'})
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'data.csv'
        a.click()
        URL.revokeObjectURL(url)
    }, [validColumnNames, sortedRowItems])

    const {visible: columnInfoVisible, handleClose: closeColumnInfo, handleOpen: openColumnInfo} = useModalWindow()

    if (!validColumnNames) return <div>Loading...</div>
    if (!colnames) return <div>No columns found</div>

    return (
        <div className="dynamic-table-view" style={{position: 'absolute', width, height, background: 'white', overflowY: 'auto'}}>
            <div style={{color: 'gray', paddingBottom: 2}}>
                <SmallIconButton onClick={openColumnInfo} icon={<Help />} title="View info about columns" />
                <SmallIconButton
                    onClick={handleExportAsCsv}
                    disabled={loading || !sortedRowItems.length || !colnames || !colnames.length}
                    icon={<Download />}
                    title="Export as CSV"
                />
            </div>
            {
                sortedRowItemsAbbreviated.length < sortedRowItems.length && (
                    <div style={{padding: 10, fontSize: 12, color: 'gray'}}>Showing {sortedRowItemsAbbreviated.length} of {sortedRowItems.length} rows</div>
                )
            }
            <table className="nwb-table-2">
                <thead>
                    <tr>
                        {
                            colnames.map((colname) => (
                                <th key={colname}>
                                    <span
                                        onClick={() => {columnSortDispatch({type: 'click', column: colname})}}
                                        style={{cursor: 'pointer'}}
                                        title={columnDescriptions[colname] || ''}
                                    >
                                        {
                                            (columnSortState.primary) && (columnSortState.primary.column === colname) && (
                                                <span style={{color: 'white'}}>{columnSortState.primary.ascending ? '▲' : '▼'}&nbsp;</span>
                                            )
                                        }
                                        {colname}
                                    </span>
                                </th>
                            ))
                        }
                    </tr>
                </thead>
                <tbody>
                    {
                        sortedRowItemsAbbreviated.map((rowItem, i) => (
                            <tr key={i}>
                                {
                                    rowItem.columnValues.map((val, j) => (
                                        <td key={j}>{valueToElement(val)}</td>
                                    ))
                                }
                            </tr>
                        ))
                    }
                </tbody>
            </table>
            <ModalWindow
                visible={columnInfoVisible}
                onClose={closeColumnInfo}
            >
                <DynamicTableColumnInfoView
                    columnNames={colnames}
                    columnDescriptions={columnDescriptions}
                />
            </ModalWindow>
        </div>
    )
}

export default DynamicTableView