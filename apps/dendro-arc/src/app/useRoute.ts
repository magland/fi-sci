import { useCallback, useMemo } from "react"
import { useLocation, useNavigate } from "react-router-dom"

export type Route = {
    page: 'home'
} | {
    page: 'about'
} | {
    page: 'projects'
} | {
    page: 'project'
    projectId: string
    tab: 'project-home' | 'project-files'
} | {
    page: 'dendro-arc-login'
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
        else if (p === '/projects') {
            return {
                page: 'projects'
            }
        }
        else if (p === '/project') {
            if (typeof query.projectId === 'string') {
                return {
                    page: 'project',
                    projectId: query.projectId,
                    tab: (query.tab || 'project-home') as 'project-home' | 'project-files'
                }
            }
            else {
                console.warn('Unexpected type for query.projectId', typeof query.projectId)
                return {
                    page: 'home'
                }
            }
        }
        else if (p === '/dendro-arc-login') {
            return {
                page: 'dendro-arc-login',
                accessToken: query.access_token as string
            }
        }
        else {
            return {
                page: 'home'
            }
        }
    }, [p, query])

    const setRoute = useCallback((r: Route, replaceHistory?: boolean) => {
        let newQuery = {...query}
        if (r.page === 'home') {
            newQuery = {p: '/'}
        }
        else if (r.page === 'about') {
            newQuery = {p: '/about'}
        }
        else if (r.page === 'projects') {
            newQuery = {p: '/projects'}
        }
        else if (r.page === 'project') {
            newQuery = {p: '/project', projectId: r.projectId, tab: r.tab}
        }
        else if (r.page === 'dendro-arc-login') {
            newQuery = {
                p: '/dendro-arc-login',
                access_token: r.accessToken
            }
        }
        // no longer supported
        // else if (r.page === 'avi') {
        //     newQuery.p = '/avi'
        //     newQuery.url = r.url
        // }
        const newSearch = queryToQueryString(newQuery)
        navigate(location.pathname + newSearch, {replace: replaceHistory})
    }, [navigate, location.pathname, query])

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