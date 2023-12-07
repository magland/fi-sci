import { ToolbarItem } from './ViewToolbar'
import { FaArrowLeft, FaArrowRight, FaSearchMinus, FaSearchPlus } from 'react-icons/fa'

export type ZoomDirection = 'in' | 'out'
export type PanDirection = 'forward' | 'back'

interface TimeWidgetToolbarProps {
    zoomTimeSelection: (factor: number, anchorTimeSec?: number) => void
    panTimeSelectionPct: (pct: number) => void
}

export const DefaultToolbarWidth = 18


const TimeWidgetToolbarEntries = (props: TimeWidgetToolbarProps): ToolbarItem[] => {
    const { zoomTimeSelection, panTimeSelectionPct } = props

    const handleZoomTimeIn = () => zoomTimeSelection(1.3)

    const handleZoomTimeOut = () => zoomTimeSelection(1 / 1.3)

    const handleShiftTimeLeft = () => panTimeSelectionPct(-0.3)

    const handleShiftTimeRight = () => panTimeSelectionPct(0.3)

    return [
        {
            type: 'button',
            title: "Time zoom in (+)",
            callback: handleZoomTimeIn,
            icon: <FaSearchPlus />,
            keyCode: 173
        },
        {
            type: 'button',
            title: "Time zoom out (-)",
            callback: handleZoomTimeOut,
            icon: <FaSearchMinus />,
            keyCode: 61
        },
        {
            type: 'button',
            title: "Shift time window back [left arrow]",
            callback: handleShiftTimeLeft,
            icon: <FaArrowLeft />,
            keyCode: 37
        },
        {
            type: 'button',
            title: "Shift time window forward [right arrow]",
            callback: handleShiftTimeRight,
            icon: <FaArrowRight />,
            keyCode: 39
        }
    ]
}

export default TimeWidgetToolbarEntries