import * as ReactDOM from 'react-dom/client';

import App from './app/App';
import { startListeningToParent } from '@fi-sci/figurl-interface';
import './styles.css';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  // <StrictMode>
  <App />
  // </StrictMode>
);

startListeningToParent();
