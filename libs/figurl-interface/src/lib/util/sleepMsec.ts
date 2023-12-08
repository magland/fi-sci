export const sleepMsec = async (msec: number, continueFunction: (() => boolean) | undefined = undefined): Promise<void> => {
    return await sleepMsecNum(msec, continueFunction)
}

export const sleepMsecNum = async (msec: number, continueFunction: (() => boolean) | undefined = undefined): Promise<void> => {
    const m = msec
    return new Promise<void>((resolve, reject) => {
        setTimeout(() => {
            resolve()
        }, m)
    })
}