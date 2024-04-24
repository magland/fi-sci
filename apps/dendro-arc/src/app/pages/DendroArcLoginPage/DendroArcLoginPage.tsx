import { FunctionComponent, useEffect } from 'react';
import useRoute from '../../useRoute';

type Props = {
    //
}

const DendroArcLoginPage: FunctionComponent<Props> = () => {
    const {route, setRoute} = useRoute()
    if (route.page !== 'dendro-arc-login') throw new Error('wrong page')
    useEffect(() => {
        if (route.accessToken) {
            const tokenInfo = {
                token: route.accessToken
            }
            localStorage.setItem('githubToken', JSON.stringify(tokenInfo))
            setRoute({page: 'dendro-arc-login', accessToken: ''}, true)
        }
    }, [route, setRoute])

    const savedInfo = localStorage.getItem('githubToken')
    let savedAccessToken: string | undefined
    try {
        savedAccessToken = savedInfo ? JSON.parse(savedInfo).token : undefined
    }
    catch {
        savedAccessToken = undefined
    }

    if ((savedAccessToken) && (!route.accessToken)) {
        return (
            <div>
                You are logged in to dendro-arc. You may close this window.
            </div>
        )
    }
    else if (route.accessToken) {
        return (
            <div>
                Logging in to dendro-arc...
            </div>
        )
    }
    else {
        return (
            <div>
                You are not logged in to dendro-arc. Something probably went wrong.
            </div>
        )
    }
}

export default DendroArcLoginPage;
