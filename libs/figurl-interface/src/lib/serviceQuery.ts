import sendRequestToParent from "./sendRequestToParent"
import { isServiceQueryResponse, ServiceQueryRequest } from "./viewInterface/FigurlRequestTypes"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const serviceQuery = async (serviceName: string, query: any, o: {includeUserId?: boolean}={}): Promise<{result: any, binaryPayload: ArrayBuffer}> => {
    const request: ServiceQueryRequest = {
        type: 'serviceQuery',
        serviceName,
        query
    }
    if (o.includeUserId) {
        request.includeUserId = true
    }
    const response = await sendRequestToParent(request)
    if (!isServiceQueryResponse(response)) throw Error('Invalid response to serviceQuery')
    if (response.errorMessage) {
        throw Error(`Error processing service query: ${response.errorMessage}`)
    }
    return {result: response.result, binaryPayload: response.binaryPayload}
}

export default serviceQuery