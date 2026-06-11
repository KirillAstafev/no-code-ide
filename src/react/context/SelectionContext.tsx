import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface SelectionContextType {
    selectedElement: SchemaNode | null;
    selectElement: (element: SchemaNode | null) => void;
}

const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

export const SelectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [selectedElement, selectElement] = useState<SchemaNode | null>(null);

    useEffect(() => {
        selectElement(null);
    }, []);

    return (
        <SelectionContext.Provider value={{ selectedElement, selectElement }}>
            {children}
        </SelectionContext.Provider>
    );
};

export const useSelection = () => {
    const context = useContext(SelectionContext);
    if (!context) {
        throw new Error('useSelection должен использоваться внутри SelectionProvider');
    }
    return context;
};