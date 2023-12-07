
export const divExists = (divRef: React.MutableRefObject<HTMLDivElement | null>) => {
    if (!divRef || !divRef.current || divRef.current === null) return false
    return true
}

export const setDivFocus = (divElmt: HTMLDivElement | null) => {
    if (!divElmt) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (divElmt as any)['_hasFocus'] = true
}

export const clearDivFocus = (divElmt: HTMLDivElement | null) => {
    if (!divElmt) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (divElmt as any)['_hasFocus'] = false
}