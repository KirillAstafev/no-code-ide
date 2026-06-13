import '@gravity-ui/uikit/styles/fonts.css';
import '@gravity-ui/uikit/styles/styles.css';

import './styles.css'

import {createRoot} from 'react-dom/client'
import {ThemeProvider} from "@gravity-ui/uikit";
import MainPage from './main/pages/MainPage.tsx'
import {ProjectProvider} from "./context/ProjectContext.tsx";
import {WindowProvider} from "./context/WindowContext.tsx";
import {GitProvider} from "./context/GitContext.tsx";
import {BuildProgressProvider} from "./main/context/BuildProgressContext";

createRoot(document.getElementById('root')!).render(
    <ThemeProvider theme="dark">
        <WindowProvider>
            <ProjectProvider>
                <GitProvider>
                    <BuildProgressProvider>
                        <MainPage/>
                    </BuildProgressProvider>
                </GitProvider>
            </ProjectProvider>
        </WindowProvider>
    </ThemeProvider>,
)
