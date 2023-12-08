import sendRequestToParent from "./sendRequestToParent"
import { isReadDirResponse, RDDir, ReadDirRequest } from "./viewInterface/FigurlRequestTypes"

const readDir = async (uri: string): Promise<RDDir> => {
    const request: ReadDirRequest = {
        type: 'readDir',
        uri
    }
    const response = await sendRequestToParent(request)
    if (!isReadDirResponse(response)) throw Error('Invalid response to readDir')
    if (response.errorMessage) {
        throw Error(`Error reading dir for ${uri}: ${response.errorMessage}`)
    }
    if (!response.dir) {
        throw Error('Unexpected, response.dir is undefined')
    }
    return response.dir
}

export default readDir