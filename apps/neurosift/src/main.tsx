import * as ReactDOM from 'react-dom/client';

import App from './app/App';
import { startListeningToParent } from '@fi-sci/figurl-interface';
import './localStyles.css';
import './index.css';
import './app/pages/NwbPage/nwb-table.css';
import './app/pages/NwbPage/nwb-table-2.css';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  // <StrictMode>
  <App />
  // </StrictMode>
);

startListeningToParent();
