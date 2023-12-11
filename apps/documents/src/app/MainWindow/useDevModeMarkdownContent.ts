import axios, { AxiosResponse } from "axios"
import { useCallback, useEffect, useState } from "react"

const useDevModeMarkdownContent = (docUrl: string | undefined) => {
    const [markdownContent, setMarkdownContent] = useState<string | undefined>()
    const [error, setError] = useState<string | undefined>()
    const refresh = useCallback(() => {
        ;(async () => {
            if (!docUrl) return
            let response: AxiosResponse
            try {
                response = await axios.get(docUrl, {responseType: 'text'})
                if (response.status !== 200) {
                    throw Error(`Error getting file ${docUrl}: ${response.status}`)
                }
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            catch(err: any) {
                setError(`${err.message}: ${err.response.data}`)
                return
            }
            setMarkdownContent(response.data)
        })()
    }, [docUrl])
    useEffect(() => {
        setError(undefined)
        setMarkdownContent(undefined)
        refresh()
    }, [refresh])
    return {markdownContent, error, refresh}
}

export const sleepMsec = async (msec: number): Promise<void> => {
    return new Promise<void>((resolve) => {
        setTimeout(() => {
            resolve()
        }, msec)
    })
}

export default useDevModeMarkdownContent