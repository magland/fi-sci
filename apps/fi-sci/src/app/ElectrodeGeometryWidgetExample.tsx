import { FunctionComponent } from "react"
import { ElectrodeGeometryWidget } from "@fi-sci/electrode-geometry"

type Props = {
    width: number
}

const exampleElectrodeLocations = [
    {x: 0, y: 0},
    {x: 100, y: 0},
    {x: 0, y: 100},
    {x: 100, y: 100},
    {x: 50, y: 50},
    {x: 150, y: 50},
    {x: 50, y: 150},
    {x: 150, y: 150},
    {x: 200, y: 200},
    {x: 300, y: 200},
    {x: 200, y: 300},
    {x: 300, y: 300},
    {x: 250, y: 250},
    {x: 350, y: 250}
]

const ElectrodeGeometryWidgetExample: FunctionComponent<Props> = ({ width }) => {
    return (
        <ElectrodeGeometryWidget
            width={width}
            height={350}
            electrodeLocations={exampleElectrodeLocations}
        />
    )
}

export default ElectrodeGeometryWidgetExample