import React from 'react';
import { Text, Select, TextInput, Checkbox, Card, Box, Button } from '@gravity-ui/uikit';
import { ChevronDown, ChevronRight } from '@gravity-ui/icons';
import { DATA_SOURCE_COMMANDS } from './constants/dataSourceCommands';

interface SourceCommandConfigProps {
    sourceName: string;
    command: DataSourceCommand;
    commandParams: Record<string, string | number | boolean>;
    onCommandChange: (commandName: string) => void;
    onParamChange: (paramName: string, value: string | number | boolean) => void;
}

const PARAM_LABELS: Record<string, string> = {
    pollingInterval: 'Интервал опроса (мс)',
    maxRetries: 'Макс. попыток',
    timeout: 'Таймаут (мс)',
    bufferSize: 'Размер буфера',
    compression: 'Сжатие',
    connectionType: 'Тип подключения',
    ipAddress: 'IP-адрес',
    ipPort: 'Порт',
    comPort: 'COM-порт',
    baudRate: 'Скорость (бод)',
    model: 'Модель ККТ',
    accessPassword: 'Пароль доступа',
    userPassword: 'Пароль пользователя',
    operatorId: 'ID оператора',
    receiptType: 'Тип чека',
    paymentType: 'Тип оплаты',
    documentType: 'Тип документа',
    syncWithSystem: 'Синхронизация с системой'
};

const SELECT_OPTIONS: Record<string, Array<{ value: string; content: string }>> = {
    receiptType: [
        { value: 'SELL', content: 'Продажа (приход)' },
        { value: 'SELL_RETURN', content: 'Возврат продажи' },
        { value: 'BUY', content: 'Покупка (расход)' },
        { value: 'BUY_RETURN', content: 'Возврат покупки' }
    ],
    paymentType: [
        { value: 'CASH', content: 'Наличные' },
        { value: 'ELECTRONICALLY', content: 'Безналичные' },
        { value: 'PREPAID', content: 'Предоплата (аванс)' },
        { value: 'CREDIT', content: 'Кредит' }
    ],
    documentType: [
        { value: 'RECEIPT', content: 'Фискальный чек' },
        { value: 'SHIFT', content: 'Отчет о закрытии смены' },
        { value: 'REGISTRATION', content: 'Документ регистрации' }
    ]
};

const NEVA_DEFAULT_VALUES: Record<string, string | number | boolean> = {
    connectionType: 'TCPIP',
    ipAddress: '192.168.1.100',
    ipPort: 7777,
    comPort: 'COM3',
    baudRate: 115200,
    model: 2,
    accessPassword: '',
    userPassword: '',
    operatorId: 1,
    receiptType: 'SELL',
    paymentType: 'CASH',
    documentType: 'RECEIPT',
    syncWithSystem: true
};

const CONNECTION_PARAMS = new Set(['connectionType', 'ipAddress', 'ipPort', 'comPort', 'baudRate']);
const AUTH_PARAMS = new Set(['accessPassword', 'userPassword', 'model']);
const PASSWORD_PARAMS = new Set(['accessPassword', 'userPassword']);

const ParamInput: React.FC<{
    param: DataSourceCommandParameter;
    value: string | number | boolean;
    onChange: (value: any) => void;
}> = ({ param, value, onChange }) => {
    const isPassword = PASSWORD_PARAMS.has(param.name);
    const selectOptions = SELECT_OPTIONS[param.name];

    if (selectOptions) {
        return (
            <Select
                value={[value as string]}
                options={selectOptions}
                onUpdate={(vals) => onChange(vals[0])}
                size="s"
                width="max"
            />
        );
    }

    if (param.type === 'boolean') {
        return (
            <Checkbox checked={value as boolean} onUpdate={onChange}>
                {PARAM_LABELS[param.name] || param.name}
            </Checkbox>
        );
    }

    if (param.type === 'number') {
        return (
            <TextInput
                value={String(value)}
                onUpdate={(val) => onChange(Number(val) || 0)}
                size="s"
                type="number"
            />
        );
    }

    return (
        <TextInput
            value={value as string}
            onUpdate={onChange}
            size="s"
            type={isPassword ? 'password' : 'text'}
        />
    );
};

const ParamGroup: React.FC<{
    title: string;
    params: DataSourceCommandParameter[];
    getParamValue: (paramName: string) => string | number | boolean;
    onParamChange: (paramName: string, value: string | number | boolean) => void;
    defaultExpanded?: boolean;
}> = ({ title, params, getParamValue, onParamChange, defaultExpanded = false }) => {
    const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

    if (params.length === 0) return null;

    return (
        <Box style={{ marginBottom: '12px' }}>
            <Button
                view="flat"
                size="s"
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '8px 12px'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isExpanded ? <ChevronDown/> : <ChevronRight/>}
                    <Text variant="body-2" style={{ fontWeight: 500 }}>{title}</Text>
                    <Text variant="caption-1" color="secondary">({params.length} параметр{params.length !== 1 ? 'а' : ''})</Text>
                </div>
            </Button>

            {isExpanded && (
                <Box style={{ paddingLeft: '24px', marginTop: '8px' }}>
                    {params.map(param => (
                        <div key={param.name} style={{ marginBottom: '12px' }}>
                            <Text variant="caption-1" color="secondary">
                                {PARAM_LABELS[param.name] || param.name}:
                            </Text>
                            <ParamInput
                                param={param}
                                value={getParamValue(param.name)}
                                onChange={(newValue) => onParamChange(param.name, newValue)}
                            />
                        </div>
                    ))}
                </Box>
            )}
        </Box>
    );
};

export const SourceCommandConfig: React.FC<SourceCommandConfigProps> = ({
                                                                            sourceName,
                                                                            command,
                                                                            commandParams,
                                                                            onCommandChange,
                                                                            onParamChange,
                                                                        }) => {
    const [isExpanded, setIsExpanded] = React.useState(false);
    const isNevaCommand = command.name.startsWith('NEVA_');

    const commandOptions = DATA_SOURCE_COMMANDS.map(cmd => ({
        value: cmd.name,
        content: `${cmd.name} - ${cmd.description}`
    }));

    const getParamValue = (paramName: string) => {
        const value = commandParams[paramName];
        if (value !== undefined && value !== null) return value;

        if (isNevaCommand && NEVA_DEFAULT_VALUES[paramName] !== undefined) {
            return NEVA_DEFAULT_VALUES[paramName];
        }

        const param = command.parameters.find(p => p.name === paramName);
        return param?.defaultValue ?? (param?.type === 'string' ? '' : param?.type === 'number' ? 0 : false);
    };

    const handleParamChange = (paramName: string, value: string | number | boolean) => {
        onParamChange(paramName, value);
    };

    const groupedParams = isNevaCommand ? {
        connection: command.parameters.filter(p => CONNECTION_PARAMS.has(p.name)),
        auth: command.parameters.filter(p => AUTH_PARAMS.has(p.name)),
        operation: command.parameters.filter(p =>
            !CONNECTION_PARAMS.has(p.name) && !AUTH_PARAMS.has(p.name)
        )
    } : {
        connection: [] as DataSourceCommandParameter[],
        auth: [] as DataSourceCommandParameter[],
        operation: command.parameters
    };

    const totalParamsCount = command.parameters.length;
    const hasParameters = totalParamsCount > 0;

    return (
        <Card style={{ marginBottom: '16px', padding: '12px' }}>
            <Box>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px'
                }}>
                    <Text variant="subheader-2">{sourceName}</Text>
                    {hasParameters && (
                        <Button
                            view="flat"
                            size="s"
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            {isExpanded ? 'Свернуть параметры' : 'Развернуть параметры'}
                        </Button>
                    )}
                </div>

                {/* Выбор команды */}
                <div style={{ marginBottom: '16px' }}>
                    <Text variant="body-2" color="secondary">Команда:</Text>
                    <Select
                        value={[command.name]}
                        options={commandOptions}
                        onUpdate={(vals) => onCommandChange(vals[0])}
                        size="s"
                        width="max"
                    />
                </div>

                {hasParameters && isExpanded && (
                    <Box style={{
                        borderTop: '1px solid var(--g-color-line-generic)',
                        paddingTop: '16px',
                        marginTop: '8px'
                    }}>
                        {isNevaCommand ? (
                            <>
                                <ParamGroup
                                    title="Параметры подключения"
                                    params={groupedParams.connection}
                                    getParamValue={getParamValue}
                                    onParamChange={handleParamChange}
                                />
                                <ParamGroup
                                    title="Параметры доступа"
                                    params={groupedParams.auth}
                                    getParamValue={getParamValue}
                                    onParamChange={handleParamChange}
                                />
                                <ParamGroup
                                    title="Параметры операции"
                                    params={groupedParams.operation}
                                    getParamValue={getParamValue}
                                    onParamChange={handleParamChange}
                                    defaultExpanded={true}
                                />
                            </>
                        ) : (
                            <ParamGroup
                                title="Параметры"
                                params={groupedParams.operation}
                                getParamValue={getParamValue}
                                onParamChange={handleParamChange}
                                defaultExpanded={true}
                            />
                        )}
                    </Box>
                )}

                {/* Индикатор количества параметров, если панель свернута */}
                {hasParameters && !isExpanded && (
                    <div style={{
                        padding: '8px',
                        backgroundColor: 'var(--g-color-surface-generic)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        textAlign: 'center'
                    }}>
                        <Text variant="caption-1" color="secondary" onClick={() => setIsExpanded(true)}>
                            {totalParamsCount} параметр{totalParamsCount !== 1 ? 'а' : ''} для настройки (нажмите для раскрытия)
                        </Text>
                    </div>
                )}
            </Box>
        </Card>
    );
};