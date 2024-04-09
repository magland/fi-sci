import { FunctionComponent, useEffect, useMemo, useState } from "react"
import useRoute from "../../useRoute"
import pako from "pako";
import NeurodataTypesSelector from "./NeurodataTypesSelector";
import { Hyperlink } from "@fi-sci/misc";

type DandiQueryPageProps = {
    width: number
    height: number
}

const DandiQueryPage: FunctionComponent<DandiQueryPageProps> = ({width, height}) => {
    const {route} = useRoute()
    if (route.page !== 'dandi-query') throw new Error('route.page !== dandi-query')

    const globalIndex = useGlobalIndex()

    const {allNeurodataTypes} = useMemo(() => {
        if (!globalIndex) return {allNeurodataTypes: []}
        const allNeurodataTypes = new Set<string>()
        for (const file of globalIndex.files) {
            for (const neurodataType of file.neurodata_types) {
                allNeurodataTypes.add(neurodataType)
            }
        }
        return {allNeurodataTypes: Array.from(allNeurodataTypes).sort()}
    }, [globalIndex])

    const [selectedNeurodataTypes, setSelectedNeurodataTypes] = useState<string[]>([])

    const results: Results | undefined = useMemo(() => {
        if (!allNeurodataTypes || !globalIndex) return undefined
        if (selectedNeurodataTypes.length === 0) return undefined
        const results: Results = {
            matchingDandisets: []
        }
        for (const file of globalIndex.files) {
            if (selectedNeurodataTypes.every(selectedNeurodataType => file.neurodata_types.includes(selectedNeurodataType))) {
                const dandisetId = file.dandiset_id
                if (results.matchingDandisets.some(x => x.dandisetId === dandisetId)) {
                    const matchingDandiset = results.matchingDandisets.find(x => x.dandisetId === dandisetId)
                    if (matchingDandiset) {
                        matchingDandiset.numMatchingAssets++
                    }
                } else {
                    results.matchingDandisets.push({
                        dandisetId,
                        numMatchingAssets: 1
                    })
                }
            }
        }
        // sort by dandiset id alphabetical
        results.matchingDandisets.sort((a, b) => a.dandisetId.localeCompare(b.dandisetId))
        return results
    }, [globalIndex, selectedNeurodataTypes])

    if (route.staging) {
        return <div>Staging not currently supported for dandi query</div>
    }
    return (
        <div style={{position: 'absolute', width, height, overflowY: 'auto'}}>
            <div style={{padding: 25}}>
                <h2>DANDI Query</h2>
                <p style={{color: 'darkred'}}>Only the first 100 assets of each Dandiset are included in the query. Results may not reflect recent updates to Dandisets.</p>
                <NeurodataTypesSelector
                    allNeurodataTypes={allNeurodataTypes}
                    selectedNeurodataTypes={selectedNeurodataTypes}
                    setSelectedNeurodataTypes={setSelectedNeurodataTypes}
                />
                <ResultsView
                    results={results}
                />
            </div>
        </div>
    )
}

type Results = {
    matchingDandisets: {
        dandisetId: string
        numMatchingAssets: number
    }[]
}

type ResultsViewProps = {
    results: Results | undefined
}

const ResultsView: FunctionComponent<ResultsViewProps> = ({results}) => {
    const {setRoute} = useRoute()
    if (!results) return null
    return (
        <table className="nwb-table">
            <thead>
                <tr>
                    <th>Dandiset ID</th>
                    <th>Number of Matching NWB Files</th>
                </tr>
            </thead>
            <tbody>
                {results.matchingDandisets.map(matchingDandiset => (
                    <tr key={matchingDandiset.dandisetId}>
                        <td>
                            <Hyperlink
                                onClick={() => {
                                    setRoute({page: 'dandiset', dandisetId: matchingDandiset.dandisetId})
                                }}
                            >
                                {matchingDandiset.dandisetId}
                            </Hyperlink>
                        </td>
                        <td>{matchingDandiset.numMatchingAssets}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}

const useGlobalIndex = () => {
    const url = 'https://lindi.neurosift.org/dandi/global_index.json.gz'
    const globalIndex = useFetchJsonGz(url)
    return globalIndex
}

type GlobalIndex = {
    files: {
        dandiset_id: string
        dandiset_version: string
        asset_id: string
        asset_path: string
        neurodata_types: string[]
    }[]
}

const useFetchJsonGz = (url: string) => {
    const [data, setData] = useState<GlobalIndex | undefined>(undefined)
    useEffect(() => {
        let canceled = false
        ; (async () => {
            setData(undefined)
            const response = await fetch(url + '?cb=' + Date.now())
            if (canceled) return
            const bufferGz = await response.arrayBuffer()
            if (canceled) return
            const buffer = pako.inflate(bufferGz)
            const text = new TextDecoder().decode(buffer)
            const json = JSON.parse(text)
            console.log('Global index', json)
            setData(json)
        })()
        return () => {
            canceled = true
        }
    }, [])
    return data
}



export default DandiQueryPage