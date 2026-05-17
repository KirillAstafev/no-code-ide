import React, { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';

type WindowAction = { type: 'SET_WINDOW_ID'; payload: string }

interface WindowState {
    windowId: string | null;
}

const initialState: WindowState = {
    windowId: null,
};

const windowReducer = (state: WindowState, action: WindowAction): WindowState => {
    switch (action.type) {
        case 'SET_WINDOW_ID':
            return {
                ...state,
                windowId: action.payload,
            };
        default:
            return state;
    }
};

const WindowContext = createContext<{
    state: WindowState;
    setWindowId: (id: string) => void;
} | undefined>(undefined);

export const WindowProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(windowReducer, initialState);

    const setWindowId = (id: string) => {
        dispatch({ type: 'SET_WINDOW_ID', payload: id });
    };

    useEffect(() => {
        const handleWindowReady = (_event: any, id: string) => {
            setWindowId(id);
        };

        window.electron.on('windowId', handleWindowReady);

        return () => {
            window.electron.off('windowId', handleWindowReady);
        };
    }, []);

    return (
        <WindowContext.Provider
            value={{
                state,
                setWindowId,
            }}
        >
            {children}
        </WindowContext.Provider>
    );
};

export const useWindow = () => {
    const context = useContext(WindowContext);
    if (!context) {
        throw new Error('useWindow должен использоваться внутри WindowProvider');
    }
    return context;
};