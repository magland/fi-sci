import React, { useCallback, useMemo, useRef } from 'react';
import { DebounceThrottleResolver, DebounceThrottleUpdater, useThrottler } from './util-rate-limiters';

type ZoomStateProperties = {
    zoomsCount: number
}

type ZoomStateRefs = {
    divRef: React.MutableRefObject<HTMLDivElement | null>
    zoomsCount: React.MutableRefObject<number>
}

type ZoomDirection = 'in' | 'out'

const defaultZoomScaleFactor = 1.4

// Convenience alias for long fn signature
type ZoomFn = (direction: ZoomDirection, factor?: number | undefined) => void

type ZoomResolverProps = {
    zoomTimeSelection: ZoomFn
}

const zoomUpdate: DebounceThrottleUpdater<ZoomStateProperties, ZoomStateRefs> = (refs, state) => {
    const { divRef } = refs
    const { zoomsCount } = state
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const divHasFocus = ((divRef?.current as any) || {})['_hasFocus']
    const unchanged = !divHasFocus || zoomsCount === 0
    if (!unchanged) {
        refs.zoomsCount.current += zoomsCount
    }
    return !unchanged
}

const zoomResolver: DebounceThrottleResolver<ZoomStateRefs, ZoomResolverProps> = (refs, props) => {
    const {zoomsCount} = refs
    const {zoomTimeSelection} = props
    if (!zoomsCount.current || zoomsCount.current === 0) return
    const direction = zoomsCount.current > 0 ? 'in' : 'out'
    const factor = defaultZoomScaleFactor ** Math.abs(zoomsCount.current)
    zoomTimeSelection && zoomTimeSelection(direction, factor)
    zoomsCount.current = 0
}

export const useThrottledZoom = (divRef: React.MutableRefObject<HTMLDivElement | null>, zoomTimeSelection: ZoomFn) => {
    const zoomsCount = useRef(0)
    const refs = useMemo(() => {return {divRef, zoomsCount}}, [divRef, zoomsCount])
    const resolverProps = useMemo(() => { return {zoomTimeSelection}}, [zoomTimeSelection])
    const zoomHandler = useThrottler(zoomUpdate, zoomResolver, refs, resolverProps, 50)
    return zoomHandler
}

const useTimeScrollZoom = (divRef: React.MutableRefObject<HTMLDivElement | null>, zoomTimeSelection: ZoomFn, opts: {shiftZoom?: boolean}={}) => {
    const { throttler } = useThrottledZoom(divRef, zoomTimeSelection)
    const wheelHandler = useCallback((e: React.WheelEvent) => {
        if (opts.shiftZoom && !e.shiftKey) return
        if (e.deltaY === 0) return
        const zoomsCount = -e.deltaY/100
        throttler({zoomsCount})
    }, [throttler, opts])
    
    return wheelHandler
}

export default useTimeScrollZoom
