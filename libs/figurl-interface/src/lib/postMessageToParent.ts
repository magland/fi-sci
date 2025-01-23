import sendRequestToParent from './sendRequestToParent';
import { isPostMessageToParentResponse, PostMessageToParentRequest } from './viewInterface/FigurlRequestTypes';

const postMessageToParent = async (message: any): Promise<void> => {
  const request: PostMessageToParentRequest = {
    type: 'postMessageToParent',
    message
  };
  const response = await sendRequestToParent(request);
  if (!isPostMessageToParentResponse(response)) throw Error('Invalid response to postMessageToParent');
};

export default postMessageToParent;
