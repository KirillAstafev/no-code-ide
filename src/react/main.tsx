import '@gravity-ui/uikit/styles/fonts.css';
import '@gravity-ui/uikit/styles/styles.css';

import './styles.css'

import { createRoot } from 'react-dom/client'
import { ThemeProvider } from "@gravity-ui/uikit";
import MainPage from './main/pages/MainPage.tsx'

createRoot(document.getElementById('root')!).render(
  <ThemeProvider theme="dark">
    <MainPage />
  </ThemeProvider>,
)
