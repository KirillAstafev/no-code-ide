import '@gravity-ui/uikit/styles/fonts.css';
import '@gravity-ui/uikit/styles/styles.css';

import './styles.css'

import { createRoot } from 'react-dom/client'
import { ThemeProvider } from "@gravity-ui/uikit";
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <ThemeProvider theme="system">
    <App />
  </ThemeProvider>,
)
