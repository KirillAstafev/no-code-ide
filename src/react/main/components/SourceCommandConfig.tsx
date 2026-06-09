import React from 'react';
import { Text, Select } from '@gravity-ui/uikit';

interface SourceCommandConfigProps {
    sourceName: string;
    command: DataSourceCommand;
    commandParams: Record<string, string | number | boolean>;
    onCommandChange: (commandName: string) => void;
    onParamChange: (paramName: string, value: string | number | boolean) => void;
}

export const SourceCommandConfig: React.FC<SourceCommandConfigProps> = ({
    sourceName,
    command,
    commandParams,
    onCommandChange,
    onParamChange,
}) => {
    const handleParamChange = (paramName: string, value: string | number | boolean) => {
        onParamChange(paramName, value);
    };

    return (
        <div style={{ marginBottom: '16px', padding: '12px', border: '1px solid var(--g-color-line-generic)', borderRadius: '4px' }}>
            <div style={{ marginBottom: '8px' }}>
                <Text variant="body-2">{sourceName}</Text>
            </div>
            <div style={{ marginBottom: '8px' }}>
                <Text variant="caption-1" color="secondary">Команда:</Text>
                <Select
                    value={[command.name]}
                    options={command.parameters.map(cmd => ({
                        content: `${cmd.name}`,
                        value: cmd.name
                    }))}
                    onUpdate={(values) => onCommandChange((values as string[])[0])}
                    size="s"
                    multiple={false}
                />
            </div>
            <div>
                <Text variant="caption-1" color="secondary">Параметры:</Text>
                {command.parameters.map(param => (
                    <div key={param.name} style={{ marginTop: '8px' }}>
                        <Text variant="caption-1">{param.name}</Text>
                        {param.type === 'boolean' ? (
                            <Select
                                value={[commandParams[param.name] as boolean ? 'true' : 'false']}
                                options={[
                                    { content: 'Да', value: 'true' },
                                    { content: 'Нет', value: 'false' }
                                ]}
                                onUpdate={(values) => handleParamChange(param.name, (values as string[])[0] === 'true')}
                                size="s"
                                multiple={false}
                            />
                        ) : param.type === 'number' ? (
                            <input
                                type="number"
                                value={commandParams[param.name] as number}
                                onChange={(e) => handleParamChange(param.name, Number(e.target.value))}
                                style={{
                                    marginTop: '4px',
                                    padding: '4px 8px',
                                    width: '100%',
                                    maxWidth: '150px',
                                    boxSizing: 'border-box'
                                }}
                            />
                        ) : (
                            <input
                                type="text"
                                value={commandParams[param.name] as string}
                                onChange={(e) => handleParamChange(param.name, e.target.value)}
                                style={{
                                    marginTop: '4px',
                                    padding: '4px 8px',
                                    width: '100%',
                                    maxWidth: '150px',
                                    boxSizing: 'border-box'
                                }}
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
