import { Key, Login, Logout, QuestionMark } from "@mui/icons-material";
import { AppBar, Toolbar } from "@mui/material";
import { FunctionComponent, useCallback, useMemo, useState } from "react";
import useRoute from "./useRoute";
import ApiKeysWindow from "./ApiKeysWindow/ApiKeysWindow";
import { SmallIconButton } from "@fi-sci/misc";
import ModalWindow from "@fi-sci/modal-window";
import { useGithubAuth } from "./GithubAuth/useGithubAuth";
import UserIdComponent from "./UserIdComponent";

export const applicationBarColor = '#bac'
export const applicationBarColorDarkened = '#546'

type Props = {
    // none
}

export const applicationBarHeight = 45

const logoUrl = `/dendro-arc-logo.png`

const ApplicationBar: FunctionComponent<Props> = () => {
    const {setRoute} = useRoute()

    const onHome = useCallback(() => {
        setRoute({page: 'home'})
    }, [setRoute])

    // const {visible: githubAccessWindowVisible, handleOpen: openGitHubAccessWindow, handleClose: closeGitHubAccessWindow} = useModalDialog()
    const {visible: apiKeysWindowVisible, handleOpen: openApiKeysWindow, handleClose: closeApiKeysWindow} = useModalDialog()

    // light greenish background color for app bar
    // const barColor = '#e0ffe0'

    const barColor = '#656565'

    // const bannerColor = '#00a000'
    const titleColor = 'white'
    // const bannerColor = titleColor

    // const star = <span style={{color: bannerColor, fontSize: 20}}>★</span>

    const {signedIn, userId, clearAccessToken} = useGithubAuth()

    return (
        <span>
            <AppBar position="static" style={{height: applicationBarHeight - 10, color: 'black', background: barColor}}>
                <Toolbar style={{minHeight: applicationBarHeight - 10}}>
                    <img src={logoUrl} alt="logo" height={30} style={{paddingBottom: 5, cursor: 'pointer'}} onClick={onHome} />
                    <div onClick={onHome} style={{cursor: 'pointer', color: titleColor}}>&nbsp;&nbsp;&nbsp;dendro-arc</div>
                    <span style={{marginLeft: 'auto'}} />
                    <span>
                        <SmallIconButton
                            icon={<QuestionMark />}
                            onClick={() => setRoute({page: 'about'})}
                            title={`About dendro-arc`}
                        />
                    </span>
                    &nbsp;&nbsp;&nbsp;&nbsp;
                    <span style={{color: 'yellow'}}>
                        <SmallIconButton
                            icon={<Key />}
                            onClick={openApiKeysWindow}
                            title={`Set API key`}
                        />
                    </span>
                    &nbsp;&nbsp;
                    &nbsp;&nbsp;
                    {
                        signedIn && (
                            <span style={{ fontFamily: 'courier', cursor: 'pointer' }} title={`Signed in as ${userId}`}><UserIdComponent color="#ccc" userId={userId} />&nbsp;&nbsp;</span>
                        )
                    }
                    <span style={{ paddingBottom: 0, cursor: 'pointer' }} onClick={() => {
                        if (!signedIn) {
                            const loginUrl = 'https://dendro-arc-auth.vercel.app'
                            window.open(loginUrl, 'dendro-arc-github-login', 'width=600,height=600');
                        }
                        else {
                            const okayToSignOut = window.confirm('Are you sure you want to sign out?')
                            if (okayToSignOut) {
                                clearAccessToken()
                            }
                        }
                    }} title={signedIn ? "Sign out" : "Sign in"}>
                        {
                            signedIn ? (
                                <Logout />
                            ) : (
                                <Login />
                            )
                        }
                        &nbsp;
                        {
                            !signedIn && (
                                <span style={{ position: 'relative', top: -5 }}>Sign in</span>
                            )
                        }
                    </span>
                </Toolbar>
            </AppBar>
            <ModalWindow
                visible={apiKeysWindowVisible}
                // onClose={closeApiKeysWindow}
            >
                <ApiKeysWindow
                    onClose={() => closeApiKeysWindow()}
                />
            </ModalWindow>
        </span>
    )
}

export const useModalDialog = () => {
    const [visible, setVisible] = useState<boolean>(false)
    const handleOpen = useCallback(() => {
        setVisible(true)
    }, [])
    const handleClose = useCallback(() => {
        setVisible(false)
    }, [])
    return useMemo(() => ({
        visible,
        handleOpen,
        handleClose
    }), [visible, handleOpen, handleClose])
}

export default ApplicationBar