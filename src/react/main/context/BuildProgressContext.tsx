import React, { createContext, useContext, useReducer, type ReactNode } from 'react';

type BuildStage = 'downloading' | 'generating' | 'building';

interface BuildProgressState {
    isOpen: boolean;
    stage: BuildStage;
    progress: number; // 0-100
}

const initialState: BuildProgressState = {
    isOpen: false,
    stage: 'downloading',
    progress: 0,
};

type BuildProgressAction =
    | { type: 'START_BUILD'; payload: { stage: BuildStage } }
    | { type: 'UPDATE_PROGRESS'; payload: { progress: number } }
    | { type: 'SET_STAGE'; payload: { stage: BuildStage } }
    | { type: 'FINISH_BUILD' };

const buildProgressReducer = (state: BuildProgressState, action: BuildProgressAction): BuildProgressState => {
    switch (action.type) {
        case 'START_BUILD':
            return {
                ...state,
                isOpen: true,
                stage: action.payload.stage,
                progress: 0,
            };
        case 'UPDATE_PROGRESS':
            return {
                ...state,
                progress: action.payload.progress,
            };
        case 'SET_STAGE':
            return {
                ...state,
                stage: action.payload.stage,
                progress: state.progress,
            };
        case 'FINISH_BUILD':
            return {
                ...state,
                isOpen: false,
                stage: 'downloading',
                progress: 0,
            };
        default:
            return state;
    }
};

const BuildProgressContext = createContext<{
    state: BuildProgressState;
    startBuild: (stage: BuildStage) => void;
    updateProgress: (progress: number) => void;
    setStage: (stage: BuildStage) => void;
    finishBuild: () => void;
} | undefined>(undefined);

export const BuildProgressProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(buildProgressReducer, initialState);

    const startBuild = (stage: BuildStage) => {
        dispatch({ type: 'START_BUILD', payload: { stage } });
    };

    const updateProgress = (progress: number) => {
        dispatch({ type: 'UPDATE_PROGRESS', payload: { progress } });
    };

    const setStage = (stage: BuildStage) => {
        dispatch({ type: 'SET_STAGE', payload: { stage } });
    };

    const finishBuild = () => {
        dispatch({ type: 'FINISH_BUILD' });
    };

    return (
        <BuildProgressContext.Provider
            value={{
                state,
                startBuild,
                updateProgress,
                setStage,
                finishBuild,
            }}
        >
            {children}
        </BuildProgressContext.Provider>
    );
};

export const useBuildProgress = () => {
    const context = useContext(BuildProgressContext);
    if (!context) {
        throw new Error('useBuildProgress должен использоваться внутри BuildProgressProvider');
    }
    return context;
};
