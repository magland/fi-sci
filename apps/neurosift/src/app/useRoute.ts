import { useCallback, useEffect, useMemo } from "react"
import { useLocation, useNavigate } from "react-router-dom"

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
    isZarr?: boolean
} | {
    page: 'dandiset'
    dandisetId: string
    dandisetVersion?: string
    staging?: boolean
} | {
    page: 'dandi'
    staging?: boolean
} | {
    page: 'github-auth'
} | {
    page: 'neurosift-annotations-login'
    accessToken: string
}

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
            return {
                page: 'nwb',
                url: typeof query.url === 'string' ? [query.url] : query.url,
                dandisetId: (query.dandisetId || '') as string,
                dandisetVersion: (query.dandisetVersion || '') as string,
                isZarr: query.zarr === '1'
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
        else {
            return {
                page: 'home'
            }
        }
    }, [p, query])

    const setRoute = useCallback((r: Route) => {
        let newQuery = {...query}
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
            else {
                if (newQuery.dandisetId) {
                    delete newQuery.dandisetId
                }
            }
            if (r.dandisetVersion) {
                newQuery.dandisetVersion = r.dandisetVersion
            }
            else {
                if (newQuery.dandisetVersion) {
                    delete newQuery.dandisetVersion
                }
            }
            if (r.isZarr) {
                newQuery.zarr = '1'
            }
            else {
                if (newQuery.zarr) {
                    delete newQuery.zarr
                }
            }
        }
        else if (r.page === 'dandiset') {
            newQuery.p = '/dandiset'
            newQuery.dandisetId = r.dandisetId
            if (r.dandisetVersion) {
                newQuery.dandisetVersion = r.dandisetVersion
            }
            else {
                if (newQuery.dandisetVersion) {
                    delete newQuery.dandisetVersion
                }
            }
            if (r.staging) {
                newQuery.staging = '1'
            }
            else {
                if (newQuery.staging) {
                    delete newQuery.staging
                }
            }
            if (newQuery.url) {
                delete newQuery.url
            }
            if (newQuery.zarr) {
                delete newQuery.zarr
            }
        }
        else if (r.page === 'dandi') {
            newQuery.p = '/dandi'
            if (r.staging) {
                newQuery.staging = '1'
            }
            else {
                if (newQuery.staging) {
                    delete newQuery.staging
                }
            }
            if (newQuery.url) {
                delete newQuery.url
            }
            if (newQuery.dandisetId) {
                delete newQuery.dandisetId
            }
            if (newQuery.dandisetVersion) {
                delete newQuery.dandisetVersion
            }
            if (newQuery.zarr) {
                delete newQuery.zarr
            }
        }
        else if (r.page === 'neurosift-annotations-login') {
            newQuery = {
                p: '/neurosift-annotations-login',
                access_token: r.accessToken
            }
        }
        // no longer supported
        // else if (r.page === 'avi') {
        //     newQuery.p = '/avi'
        //     newQuery.url = r.url
        // }
        const newSearch = queryToQueryString(newQuery)
        navigate(location.pathname + newSearch)
    }, [navigate, location.pathname, query])

    useEffect(() => {
        if (p === '/') {
            setRoute({page: 'dandi', staging: !!query.staging})
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
        const value = b[1]
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