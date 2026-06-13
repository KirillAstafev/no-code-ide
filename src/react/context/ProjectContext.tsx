import React, {createContext, type ReactNode, useContext, useReducer} from 'react';

type ProjectAction =
    | { type: 'LOAD_PROJECT'; payload: Project }
    | { type: 'UPDATE_PROJECT'; payload: Partial<Project> }
    | { type: 'CLEAR_PROJECT' }
    | { type: 'SAVE_SUCCESS' }
    | { type: 'SET_MODIFIED'; payload: boolean };

interface ProjectState {
    project: Project | null;
    projectPath: string | null;
    isLoaded: boolean;
    isModified: boolean;
}

const initialState: ProjectState = {
    project: null,
    projectPath: null,
    isLoaded: false,
    isModified: false,
};

const projectReducer = (state: ProjectState, action: ProjectAction): ProjectState => {
    switch (action.type) {
        case 'LOAD_PROJECT':
            return {
                ...state,
                project: action.payload,
                projectPath: action.payload.location,
                isLoaded: true,
                isModified: false,
            };
        case 'UPDATE_PROJECT':
            if (!state.project) return state;
            return {
                ...state,
                project: { ...state.project, ...action.payload },
                isModified: true,
            };
        case 'CLEAR_PROJECT':
            return initialState;
        case 'SAVE_SUCCESS':
            return {
                ...state,
                isModified: false,
            };
        case 'SET_MODIFIED':
            return {
                ...state,
                isModified: action.payload,
            };
        default:
            return state;
    }
};

const ProjectContext = createContext<{
    state: ProjectState;
    loadProject: (project: Project) => void;
    updateProject: (data: Partial<Project>) => void;
    clearProject: () => void;
    saveProject: () => Promise<void>;
} | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(projectReducer, initialState);

    const loadProject = (project: Project) => {
        dispatch({ type: 'LOAD_PROJECT', payload: project });
    };

    const updateProject = (data: Partial<Project>) => {
        dispatch({ type: 'UPDATE_PROJECT', payload: data });
    };

    const clearProject = () => {
        dispatch({ type: 'CLEAR_PROJECT' });
    };

    const saveProject = async () => {
        if (!state.project || !state.projectPath) {
            throw new Error('Нет загруженного проекта для сохранения');
        }

        try {
            const projectToSave = { ...state.project, location: state.projectPath };
            const result = await window.electron.saveProject(projectToSave);

            if (result.success) {
                dispatch({ type: 'SAVE_SUCCESS' });
            } else {
                throw new Error(result.error);
            }
        } catch (err) {
            console.error('Ошибка сохранения проекта:', err);
            throw err;
        }
    };

    return (
        <ProjectContext.Provider
            value={{
                state,
                loadProject,
                updateProject,
                clearProject,
                saveProject,
            }}
        >
            {children}
        </ProjectContext.Provider>
    );
};

export const useProject = () => {
    const context = useContext(ProjectContext);
    if (!context) {
        throw new Error('useProject должен использоваться внутри ProjectProvider');
    }
    return context;
};