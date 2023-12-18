import { GetFigureDataRequest, isGetFigureDataResponse } from './viewInterface/FigurlRequestTypes';
import sendRequestToParent from './sendRequestToParent';
import deserializeReturnValue from './deserializeReturnValue';

const getFigureData = async () => {
  const request: GetFigureDataRequest = {
    type: 'getFigureData',
    figurlProtocolVersion: 'p1'
  };
  const response = await sendRequestToParent(request);
  if (!isGetFigureDataResponse(response)) throw Error('Invalid response to getFigureData');
  return deserializeReturnValue(response.figureData);
};

export default getFigureData;
