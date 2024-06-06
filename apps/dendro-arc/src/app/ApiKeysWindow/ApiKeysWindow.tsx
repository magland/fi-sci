import { Hyperlink } from "@fi-sci/misc"
import { FunctionComponent, useCallback, useEffect, useReducer, useState } from "react"
import { useGithubAuth } from "../GithubAuth/useGithubAuth"
import { createDendroApiKeyForUser } from "../dbInterface/dbInterface"
import UserIdComponent from "../UserIdComponent"

type ApiKeysWindowProps = {
    onClose: () => void
}

type KeysState = {
    placeholderApiKey: string
}

const defaultKeysState: KeysState = {
    placeholderApiKey: '',
}

type KeysAction = {
    type: 'setPlaceholderApiKey'
    value: string
}

const keysReducer = (state: KeysState, action: KeysAction): KeysState => {
    switch (action.type) {
        case 'setPlaceholderApiKey':
            return {...state, placeholderApiKey: action.value}
        default:
            throw new Error('invalid action type')
    }
}

const ApiKeysWindow: FunctionComponent<ApiKeysWindowProps> = ({onClose}) => {
    const [, keysDispatch] = useReducer(keysReducer, defaultKeysState)
    useEffect(() => {
        // initialize from local storage
        const placeholderApiKey = localStorage.getItem('placeholderApiKey') || ''
        keysDispatch({type: 'setPlaceholderApiKey', value: placeholderApiKey})
    }, [])
    // const handleSave = useCallback(() => {
    //     localStorage.setItem('placeholderApiKey', keys.placeholderApiKey)
    //     onClose()
    // }, [keys, onClose])
    const auth = useGithubAuth()

    const [newDendroApiKey, setNewDendroApiKey] = useState<string>('')
    const handleGenerateDendroApiKey = useCallback(async () => {
        const okay = window.confirm('Are you sure you want to generate a new Dendro API key? Any previously generated keys will be revoked.')
        if (!okay) return
        const apiKey = await createDendroApiKeyForUser(auth)
        setNewDendroApiKey(apiKey)
    }, [auth])

    return (
        <div style={{padding: 30}}>
            <h3>Set API Keys</h3>
            <hr />
            <table className="table-1" style={{maxWidth: 300}}>
                <tbody>
                    {/* <tr>
                        <td>Placeholder API Key: </td>
                        <td><input type="password" value={keys.placeholderApiKey} onChange={e => keysDispatch({type: 'setPlaceholderApiKey', value: e.target.value})} /></td>
                        <td><button onClick={handleSave}>Save</button></td>
                    </tr> */}
                </tbody>
            </table>
            <hr />
            {auth.userId && !newDendroApiKey && (
                <Hyperlink onClick={handleGenerateDendroApiKey}>Re-generate Dendro API key for <UserIdComponent userId={auth.userId} /></Hyperlink>
            )}
            {!auth.userId && (
                <p>You must be logged in to generate a Dendro API key.</p>
            )}
            {newDendroApiKey && (
                <div>
                    <p>Here is the new Dendro API key for your user. Save it somewhere safe. Any previously generated keys have been revoked.</p>
                    <p>{newDendroApiKey}</p>
                </div>
            )}
            <hr />
            <div>
                <button onClick={onClose}>Close</button>
            </div>
        </div>
    )
}

export default ApiKeysWindow