import { FunctionComponent, useEffect, useState } from "react"
import {ElectrodeGeometryWidget, ElectrodeLocation} from "@fi-sci/electrode-geometry"
import { RemoteH5FileX } from "@fi-sci/remote-h5-file"

type ElectrodeGeometryViewProps = {
    width: number
    height: number
    nwbFile: RemoteH5FileX
    colors?: string[]
}

const ElectrodeGeometryView: FunctionComponent<ElectrodeGeometryViewProps> = ({width, height, nwbFile, colors}) => {
    const [electrodeLocations, setElectrodeLocations] = useState<ElectrodeLocation[] | undefined>(undefined)
    useEffect(() => {
        (async () => {
            setElectrodeLocations(undefined)
            const grp = await nwbFile.getGroup('/general/extracellular_ephys/electrodes')
            if (!grp) {
                console.error('Unable to load group: /general/extracellular_ephys/electrodes')
                return
            }
            if (!grp.datasets) {
                console.error('No datasets found in group: /general/extracellular_ephys/electrodes')
                return
            }
            let xDatasetPath = ''
            let yDatasetPath = ''
            if (grp.datasets.find(ds => (ds.name === 'rel_x'))) {
                xDatasetPath = '/general/extracellular_ephys/electrodes/rel_x'
                yDatasetPath = '/general/extracellular_ephys/electrodes/rel_y'
            }
            else if (grp.datasets.find(ds => (ds.name === 'x'))) {
                xDatasetPath = '/general/extracellular_ephys/electrodes/x'
                yDatasetPath = '/general/extracellular_ephys/electrodes/y'
            }
            else {
                console.error('No x/y or rel_x/rel_y datasets found in group: /general/extracellular_ephys/electrodes')
                return
            }
            if ((!xDatasetPath) || (!yDatasetPath)) {
                console.error('Unable to find x/y or rel_x/rel_y datasets in group: /general/extracellular_ephys/electrodes')
            }
            const x = await nwbFile.getDatasetData(xDatasetPath, {})
            if (!x) {
                console.error(`Unable to load dataset: ${xDatasetPath}`)
                return
            }
            const y = await nwbFile.getDatasetData(yDatasetPath, {})
            if (!y) {
                console.error(`Unable to load dataset: ${yDatasetPath}`)
                return
            }
            const locations: ElectrodeLocation[] = []
            for (let i = 0; i < x.length; i++) {
                locations.push({x: x[i], y: y[i]})
            }
            console.log('---- setting electrode locations', locations)
            setElectrodeLocations(locations)
        })()
    }, [nwbFile])
    if (!electrodeLocations) return <div />
    return (
        <ElectrodeGeometryWidget
            width={width}
            height={height}
            electrodeLocations={electrodeLocations}
            colors={colors}
        />
    )
}

export default ElectrodeGeometryView