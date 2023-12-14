import { useCallback, useState } from "react";
import { AffineTransform, applyAffineTransform, createAffineTransform, identityAffineTransform, inverseAffineTransform, multAffineTransforms } from "./AffineTransform";

export const useWheelZoom = (width: number, height: number, o: {shift?: boolean, alt?: boolean}={}) => {
    const shift = o.shift !== undefined ? o.shift : true
    const alt = o.shift !== undefined ? o.alt : false
    const [affineTransform, setAffineTransform] = useState<AffineTransform>(identityAffineTransform)
    const handleWheel = useCallback((e: React.WheelEvent) => {
        if ((shift) && (!e.shiftKey)) return
        if ((!shift) && (e.shiftKey)) return
        if ((alt) && (!e.altKey)) return
        if ((!alt) && (e.altKey)) return
        const boundingRect = e.currentTarget.getBoundingClientRect()
        const point = {x: e.clientX - boundingRect.x, y: e.clientY - boundingRect.y}
        const deltaY = e.deltaY
        const scaleFactor = 1.3
        let X = createAffineTransform([
            [scaleFactor, 0, (1 - scaleFactor) * point.x],
            [0, scaleFactor, (1 - scaleFactor) * point.y]
        ])
        if (deltaY > 0) X = inverseAffineTransform(X)
        let newTransform = multAffineTransforms(
            X,
            affineTransform
        )
        // test to see if we should snap back to identity
        const p00 = applyAffineTransform(newTransform, {x: 0, y: 0})
        const p11 = applyAffineTransform(newTransform, {x: width, y: height})
        if ((0 <= p00.x) && (p00.x < width) && (0 <= p00.y) && (p00.y < height)) {
            if ((0 <= p11.x) && (p11.x < width) && (0 <= p11.y) && (p11.y < height)) {
                newTransform = identityAffineTransform
            }
        }

        setAffineTransform(newTransform)
        return false
    }, [affineTransform, height, width, shift, alt])
    return {
        affineTransform,
        handleWheel
    }
}

export default useWheelZoom