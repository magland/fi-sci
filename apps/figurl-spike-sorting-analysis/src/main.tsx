import * as ReactDOM from 'react-dom/client';

import App from './app/app';
import { startListeningToParent } from '@fi-sci/figurl-interface';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  // <StrictMode>
    <App />
  // </StrictMode>
);

startListeningToParent();