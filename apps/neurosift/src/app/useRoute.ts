import { useCallback, useEffect, useMemo } from "react"
import { useLocation, useNavigate } from "react-router-dom"

export type StorageType = 'h5' | 'zarr' | 'lindi'

export type Route = {
    page: 'home'
} | {
    page: 'about'
} | {
    page: 'browse'
    folder: string
} | {
    page: 'test'
} | {
    page: 'nwb'
    url: string[]
    dandisetId?: string
    dandisetVersion?: string
    dandiAssetId?: string
    storageType: StorageType[]
} | {
    page: 'avi'
    url: string
    dandisetId?: string
    dandisetVersion?: string
    dandiAssetId?: string
} | {
    page: 'dandiset'
    dandisetId: string
    dandisetVersion?: string
    staging?: boolean
} | {
    page: 'dandi'
    staging?: boolean
} | {
    page: 'annotations'
} | {
    page: 'dandi-query'
    staging?: boolean
} | {
    page: 'tests'
} | {
    page: 'github-auth'
} | {
    page: 'neurosift-annotations-login'
    accessToken: string
} | {
    page: 'plugin'
    plugin: PluginName
    dandisetId?: string
    dandisetVersion?: string
    staging?: boolean
}

type PluginName = 'EphysSummary'

const useRoute = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const search = location.search
    const query = useMemo(() => (parseSearchString(search)), [search])
    const p = query.p || '/'
    const route: Route = useMemo(() => {
        if (typeof p !== 'string') {
            console.warn('Unexpected type for p', typeof p)
            return {
                page: 'home'
            }
        }
        if (p === '/about') {
            return {
                page: 'about'
            }
        }
        else if (p.startsWith('/b/') || (p === '/b') || (p.startsWith('/browse/') || (p === '/browse'))) {
            const a = p.split('/')
            const folder = a.slice(2).join('/')
            return {
                page: 'browse',
                folder
            }
        }
        else if (p === '/github/auth') {
            return {
                page: 'github-auth'
            }
        }
        else if (p === '/test') {
            return {
                page: 'test'
            }
        }
        else if (p === '/nwb') {
            const urlList = typeof query.url === 'string' ? [query.url] : query.url // actually a list of urls
            const storageType: StorageType[] = []
            if (!query.st) {
                for (let i = 0; i < urlList.length; i++) {
                    storageType.push('h5')
                }
            }
            else if (typeof query.st === 'string') {
                for (let i = 0; i < urlList.length; i++) {
                    storageType.push(query.st as StorageType)
                }
            }
            else {
                for (let i = 0; i < urlList.length; i++) {
                    storageType.push(query.st[i] as StorageType)
                }
            }
            return {
                page: 'nwb',
                url: urlList,
                dandisetId: (query.dandisetId || '') as string,
                dandisetVersion: (query.dandisetVersion || '') as string,
                dandiAssetId: (query.dandiAssetId || '') as string,
                storageType
            }
        }
        else if (p === '/avi') {
            return {
                page: 'avi',
                url: query.url as string,
                dandisetId: query.dandisetId ? query.dandisetId as string : undefined,
                dandisetVersion: query.dandisetVersion ? query.dandisetVersion as string : undefined,
                dandiAssetId: query.dandiAssetId ? query.dandiAssetId as string : undefined
            }
        }
        else if (p === '/dandiset') {
            return {
                page: 'dandiset',
                dandisetId: query.dandisetId as string,
                dandisetVersion: (query.dandisetVersion || '') as string,
                staging: query.staging === '1'
            }
        }
        else if (p === '/dandi') {
            return {
                page: 'dandi',
                staging: query.staging === '1'
            }
        }
        else if (p === '/annotations') {
            return {
                page: 'annotations'
            }
        }
        else if (p === '/dandi-query') {
            return {
                page: 'dandi-query',
                staging: query.staging === '1'
            }
        }
        else if (p === '/tests') {
            return {
                page: 'tests'
            }
        }
        // no longer supported
        // else if (p === '/avi') {
        //     return {
        //         page: 'avi',
        //         url: query.url
        //     }
        // }
        else if (p === '/neurosift-annotations-login') {
            return {
                page: 'neurosift-annotations-login',
                accessToken: query.access_token as string
            }
        }
        else if (p === '/plugin') {
            return {
                page: 'plugin',
                plugin: query.plugin as PluginName,
                dandisetId: query.dandisetId ? query.dandisetId as string : undefined,
                dandisetVersion: query.dandisetVersion ? query.dandisetVersion as string : undefined,
                staging: query.staging === '1'
            }
        }
        else {
            return {
                page: 'home'
            }
        }
    }, [p, query])

    const setRoute = useCallback((r: Route, replaceHistory?: boolean) => {
        let newQuery: { [key: string]: string | string[] } = {}
        if (r.page === 'home') {
            newQuery = {p: '/'}
        }
        else if (r.page === 'about') {
            newQuery = {p: '/about'}
        }
        else if (r.page === 'browse') {
            newQuery.p = '/b/' + r.folder
        }
        else if (r.page === 'test') {
            newQuery.p = '/test'
        }
        else if (r.page === 'nwb') {
            newQuery.p = '/nwb'
            newQuery.url = r.url
            if (r.dandisetId) {
                newQuery.dandisetId = r.dandisetId
            }
            if (r.dandisetVersion) {
                newQuery.dandisetVersion = r.dandisetVersion
            }
            if (r.dandiAssetId) {
                newQuery.dandiAssetId = r.dandiAssetId
            }
            if (r.storageType.some(t => t !== 'h5')) { // if any of storageType is not h5
                newQuery.st = r.storageType
            }
        }
        else if (r.page === 'avi') {
            newQuery.p = '/avi'
            newQuery.url = r.url
            if (r.dandisetId) {
                newQuery.dandisetId = r.dandisetId
            }
            if (r.dandisetVersion) {
                newQuery.dandisetVersion = r.dandisetVersion
            }
            if (r.dandiAssetId) {
                newQuery.dandiAssetId = r.dandiAssetId
            }
        }
        else if (r.page === 'dandiset') {
            newQuery.p = '/dandiset'
            newQuery.dandisetId = r.dandisetId
            if (r.dandisetVersion) {
                newQuery.dandisetVersion = r.dandisetVersion
            }
            if (r.staging) {
                newQuery.staging = '1'
            }
        }
        else if (r.page === 'dandi') {
            newQuery.p = '/dandi'
            if (r.staging) {
                newQuery.staging = '1'
            }
        }
        else if (r.page === 'annotations') {
            newQuery.p = '/annotations'
        }
        else if (r.page === 'dandi-query') {
            newQuery.p = '/dandi-query'
            if (r.staging) {
                newQuery.staging = '1'
            }
        }
        else if (r.page === 'tests') {
            newQuery.p = '/tests'
        }
        else if (r.page === 'neurosift-annotations-login') {
            newQuery = {
                p: '/neurosift-annotations-login',
                access_token: r.accessToken
            }
        }
        else if (r.page === 'plugin') {
            newQuery = {
                p: '/plugin',
                plugin: r.plugin
            }
            if (r.dandisetId) {
                newQuery.dandisetId = r.dandisetId
            }
            if (r.dandisetVersion) {
                newQuery.dandisetVersion = r.dandisetVersion
            }
            if (r.staging) {
                newQuery.staging = '1'
            }
        }
        // no longer supported
        // else if (r.page === 'avi') {
        //     newQuery.p = '/avi'
        //     newQuery.url = r.url
        // }
        const newSearch = queryToQueryString(newQuery)
        navigate(location.pathname + newSearch, {replace: replaceHistory})
    }, [navigate, location.pathname])

    useEffect(() => {
        if (p === '/') {
            setRoute({page: 'dandi', staging: !!query.staging}, true)
        }
    }, [p, setRoute, query.staging])

    return {
        route,
        setRoute
    }
}

const parseSearchString = (search: string) => {
    const query: { [key: string]: string | string[] } = {}
    const a = search.slice(1).split('&')
    for (const s of a) {
        const b = s.split('=')
        const key = b[0]
        let value = b.slice(1).join('=')
        value = decodeURIComponent(value)
        if (value.startsWith('"')) {
            value = value.slice(1)
        }
        if (value.endsWith('"')) {
            value = value.slice(0, -1)
        }
        if ((key in query) && (query[key])) {
            if (Array.isArray(query[key])) {
                (query[key] as string[]).push(value)
            }
            else if (typeof query[key] === 'string') {
                query[key] = [query[key] as string, value]
            }
            else {
                console.warn('Unexpected query[key] type in parseSearchString', typeof query[key])
            }
        }
        else {
            query[key] = value
        }
    }
    return query
}

const queryToQueryString = (query: { [key: string]: string | string[] }) => {
    const a: string[] = []
    for (const key in query) {
        if (query[key]) {
            if (Array.isArray(query[key])) {
                for (const value of (query[key] as string[])) {
                    a.push(`${key}=${value}`)
                }
            }
            else if (typeof query[key] === 'string') {
                a.push(`${key}=${query[key]}`)
            }
            else {
                console.warn('Unexpected query[key] type in queryToQueryString', typeof query[key])
            }
        }
    }
    return '?' + a.join('&')
}

export default useRoute