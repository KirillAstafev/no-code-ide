export const DATA_SOURCE_COMMANDS: DataSourceCommand[] = [
    {
        name: 'NEVA_GET_STATUS',
        description: 'Запрос общей информации и статуса ККТ НЕВА-03-Ф',
        parameters: [
            { name: 'model', type: 'number', defaultValue: 2 },
            { name: 'accessPassword', type: 'string', defaultValue: '' },
            { name: 'userPassword', type: 'string', defaultValue: '' }
        ]
    },
    {
        name: 'NEVA_GET_SHORT_STATUS',
        description: 'Короткий запрос статуса ККТ (денежный ящик, бумага, крышка)',
        parameters: []
    },
    {
        name: 'NEVA_GET_CASH_SUM',
        description: 'Запрос суммы наличных в денежном ящике ККТ',
        parameters: []
    },
    {
        name: 'NEVA_GET_SHIFT_STATE',
        description: 'Запрос состояния смены (открыта/закрыта, номер смены)',
        parameters: []
    },
    {
        name: 'NEVA_OPEN_SHIFT',
        description: 'Открытие смены на ККТ НЕВА-03-Ф',
        parameters: [
            { name: 'operatorId', type: 'number', defaultValue: 1 }
        ]
    },
    {
        name: 'NEVA_CLOSE_SHIFT',
        description: 'Закрытие смены на ККТ НЕВА-03-Ф',
        parameters: [
            { name: 'operatorId', type: 'number', defaultValue: 1 }
        ]
    },
    {
        name: 'NEVA_GET_REGISTRATIONS_COUNT',
        description: 'Запрос количества регистраций по типу чека',
        parameters: [
            { name: 'receiptType', type: 'string', defaultValue: 'SELL' }
        ]
    },
    {
        name: 'NEVA_GET_REGISTRATIONS_SUM',
        description: 'Запрос суммы регистраций по типу чека',
        parameters: [
            { name: 'receiptType', type: 'string', defaultValue: 'SELL' }
        ]
    },
    {
        name: 'NEVA_GET_PAYMENT_SUM',
        description: 'Запрос суммы платежей по типу оплаты и типу чека',
        parameters: [
            { name: 'receiptType', type: 'string', defaultValue: 'SELL' },
            { name: 'paymentType', type: 'string', defaultValue: 'CASH' }
        ]
    },
    {
        name: 'NEVA_GET_CASHIN_SUM',
        description: 'Запрос суммы внесений в ККТ за смену',
        parameters: []
    },
    {
        name: 'NEVA_GET_CASHOUT_SUM',
        description: 'Запрос суммы выплат из ККТ за смену',
        parameters: []
    },
    {
        name: 'NEVA_GET_REVENUE',
        description: 'Запрос суммы выручки за смену',
        parameters: []
    },
    {
        name: 'NEVA_GET_DATE_TIME',
        description: 'Запрос текущих даты и времени с ККТ',
        parameters: []
    }
];