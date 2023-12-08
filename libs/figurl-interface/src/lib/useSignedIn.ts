import { useEffect, useState } from "react"
import { randomAlphaString } from "./sendRequestToParent"

type UserInfo = {userId?: string, googleIdToken?: string}

class UserInfoManager {
    #listeners: {[key: string]: () => void} = {}
    #userInfo: UserInfo = {}
    setUserInfo(info: UserInfo) {
        this.#userInfo = {...info}
        for (const id in this.#listeners) {
            this.#listeners[id]()
        }
    }
    public get userInfo() {
        return this.#userInfo
    }
    onChange(cb: () => void) {
        const listenerId = randomAlphaString(10)
        this.#listeners[listenerId] = cb
        const cancel = () => {
            if (listenerId in this.#listeners) {
                delete this.#listeners[listenerId]
            }
        }
        return cancel
    }
}

const userInfoManager = new UserInfoManager()

export const handleSetCurrentUser = (userInfo: UserInfo) => {
    userInfoManager.setUserInfo(userInfo)
}

const useSignedIn = (): UserInfo => {
    const [userInfo, setUserInfo] = useState<UserInfo>({})
    useEffect(() => {
        setUserInfo(userInfoManager.userInfo)
        const cancel = userInfoManager.onChange(() => {
            setUserInfo(userInfoManager.userInfo)
        })
        return cancel
    }, [])
    return userInfo
}

export default useSignedIn