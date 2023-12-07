import React, { useCallback, useMemo } from 'react';
import { clearDivFocus, setDivFocus } from './divRefHandling';
import useTimeScrollPan, { PanUpdateProperties } from './useTimeScrollPan';
import { useTimeSelection } from '@fi-sci/time-selection';

type ClickReader = (e: React.MouseEvent) => { mouseX: number, fraction: number }
const useClickReader = (leftMargin: number, panelWidthPx: number): ClickReader => {
    return useCallback((e: React.MouseEvent) => {
        const x = e.clientX - e.currentTarget.getBoundingClientRect().x - leftMargin
        const frac = Math.max(0, Math.min(1, x / panelWidthPx))
        return { mouseX: x, fraction: frac }
    }, [leftMargin, panelWidthPx])
}


const useMousedownHandler = (divElmt: HTMLDivElement | null, clickReader: ClickReader, resetPanStateAnchor: (mouseX: number) => void) => {
    const handler = useCallback((e: React.MouseEvent) => {
        if (divElmt) {
            const {mouseX} = clickReader(e)
            resetPanStateAnchor(mouseX)
        }
    }, [divElmt, clickReader, resetPanStateAnchor])

    return handler
}


const useMouseLeaveHandler = (divElmt: HTMLDivElement | null, clearPanState: () => void) => {
    const handler = useCallback((e: React.MouseEvent) => {
        if (divElmt) {
            clearPanState()
            clearDivFocus(divElmt)
        }
    }, [divElmt, clearPanState])

    return handler
}


const useClickHandler = (divElmt: HTMLDivElement | null, clickReader: ClickReader, setCurrentTimeFraction: (fraction: number, opts: {event: React.MouseEvent}) => void) => {
    const handler = useCallback((e: React.MouseEvent) => {
        if (divElmt) {
            const {fraction} = clickReader(e)
            setCurrentTimeFraction(fraction, {event: e})
            setDivFocus(divElmt)
        }
    }, [clickReader, setCurrentTimeFraction, divElmt])

    return handler
}


const useMouseupHandler = (divElmt: HTMLDivElement | null, isPanning: () => boolean, handleClick: (e: React.MouseEvent) => void, clearPan: () => void) => {
    const handler = useCallback((e: React.MouseEvent) => {
        if (divElmt) {
            if (!isPanning()) {
                handleClick(e)
            }
            clearPan()
        }
    }, [divElmt, isPanning, handleClick, clearPan])

    return handler
}


const useMouseMoveHandler = (divElmt: HTMLDivElement | null, clickReader: ClickReader, startPan: (mouseX: number) => void, setPanUpdate: (state: PanUpdateProperties) => void) => {
    const handler = useCallback((e: React.MouseEvent) => {
        if (!divElmt) {
            return
        }
        const {mouseX} = clickReader(e)
        startPan(mouseX)
        setPanUpdate({mouseX})
    }, [divElmt, clickReader, startPan, setPanUpdate])

    return handler
}


const useTimeScrollEventHandlers = (leftMargin: number, panelWidth: number, panelWidthSeconds: number, divElmt: HTMLDivElement | null) => {
    const { setCurrentTimeFraction, panTimeSelection } = useTimeSelection()

    const clickReader = useClickReader(leftMargin, panelWidth)
    const secondsPerPixel = useMemo(() => panelWidthSeconds / panelWidth, [panelWidthSeconds, panelWidth])
    const {setPanUpdate, resetAnchor, startPan, clearPan, isPanning} = useTimeScrollPan(divElmt, secondsPerPixel, panTimeSelection)
    const handleClick = useClickHandler(divElmt, clickReader, setCurrentTimeFraction)
    const handleMouseDown = useMousedownHandler(divElmt, clickReader, resetAnchor)
    const handleMouseUp = useMouseupHandler(divElmt, isPanning, handleClick, clearPan)
    const handleMouseMove = useMouseMoveHandler(divElmt, clickReader, startPan, setPanUpdate)
    const handleMouseLeave = useMouseLeaveHandler(divElmt, clearPan)

    const handlers = useMemo(() => {
        return {handleMouseUp, handleMouseMove, handleMouseDown, handleMouseLeave}
    }, [handleMouseUp, handleMouseMove, handleMouseDown, handleMouseLeave])

    return handlers
}

export default useTimeScrollEventHandlers