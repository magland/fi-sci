import { FunctionComponent, useEffect, useState } from "react"
import { RoiClient, TASPrefs } from "./TimeAlignedSeriesItemView"

type RoiWidgetProps = {
    width: number
    height: number
    path: string
    roiClient: RoiClient
    roiIndex: number
    alignToVariables: string[]
    groupByVariable: string
    windowRange: {start: number, end: number}
    prefs: TASPrefs
}

const RoiWidget: FunctionComponent<RoiWidgetProps> = ({width, height, path, roiClient, roiIndex, alignToVariables, groupByVariable, windowRange, prefs}) => {
    const topBarHeight = 40
    const [arrayData, setArrayData] = useState<number[][] | undefined>(undefined)
    useEffect(() => {
        roiClient.waitForLoaded().then(() => {
            setArrayData(roiClient.arrayData)
        })
    }, [roiClient])
    const groupLegendWidth = 0
    const W = (width - groupLegendWidth) / (alignToVariables.length || 1)
    return (
        <div style={{position: 'absolute', width, height, overflow: 'hidden'}}>
            <hr />
            <div style={{position: 'absolute', width, height: topBarHeight, fontSize: 24, marginLeft: 30}}>
                ROI {roiIndex}
            </div>
            {
                arrayData ? (
                    alignToVariables.map((alignToVariable, i) => (
                        <div key={alignToVariable} style={{position: 'absolute', width: W, height: height - topBarHeight, top: topBarHeight, left: i * W}}>
                            {/* <PSTHUnitAlignToWidget
                                width={W}
                                height={height - topBarHeight}
                                path={path}
                                spikeTrain={spikeTrain}
                                unitId={unitId}
                                alignToVariable={alignToVariable}
                                groupByVariable={groupByVariable}
                                windowRange={windowRange}
                                prefs={prefs}
                            /> */}
                        </div>
                    ))
                ) : (
                    <div style={{position: 'absolute', width, height: height - topBarHeight, top: topBarHeight}}>
                        Loading data...
                    </div>
                )
            }
        </div>
    )
}

export default RoiWidget
