import {normalizeIdentifier, normalizePropertyName} from "./shared.js";

export function generateSourceClass(source: DataSourceInfo, basePackage: string): string {
    const className = `${normalizeIdentifier(source.name)}Source`;
    const packageDeclaration = `package ${basePackage};\n`;
    const propertyName = normalizePropertyName(source.name);

    const imports = `import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import ru.neva.drivers.fptr.Fptr;
import ru.neva.drivers.fptr.IFptr;\n`;

    // Генерация полей для настроек
    const fields = `
    private IFptr fptr;
    private boolean connected = false;
    
    @Value("${"$"}{app.sources.${propertyName}.ipAddress}")
    private String ipAddress;
    
    @Value("${"$"}{app.sources.${propertyName}.tcpPort}")
    private int tcpPort;
    
    @Value("${"$"}{app.sources.${propertyName}.accessPassword:}")
    private String accessPassword;
    
    @Value("${"$"}{app.sources.${propertyName}.userPassword:}")
    private String userPassword;`;

    // Метод инициализации
    const initMethod = `
    @PostConstruct
    public void init() {
        try {
            fptr = new Fptr();
            
            String settings = String.format(
                "{\\"%s\\": %d, \\"%s\\": %d, \\"%s\\": \\"%s\\", \\"%s\\": %d}",
                IFptr.LIBFPTR_SETTING_MODEL, IFptr.LIBFPTR_MODEL_NEVA_3F,
                IFptr.LIBFPTR_SETTING_PORT, IFptr.LIBFPTR_PORT_TCPIP,
                IFptr.LIBFPTR_SETTING_IPADDRESS, ipAddress,
                IFptr.LIBFPTR_SETTING_IPPORT, tcpPort
            );
            
            fptr.setSettings(settings);
            
            if (accessPassword != null && !accessPassword.isEmpty()) {
                fptr.setSingleSetting(IFptr.LIBFPTR_SETTING_ACCESS_PASSWORD, accessPassword);
            }
            if (userPassword != null && !userPassword.isEmpty()) {
                fptr.setSingleSetting(IFptr.LIBFPTR_SETTING_USER_PASSWORD, userPassword);
            }
            
            fptr.applySingleSettings();
            fptr.open();
            connected = fptr.isOpened();
            
            System.out.println("KKT ${source.name} initialized at " + ipAddress + ":" + tcpPort);
        } catch (Exception e) {
            System.err.println("Failed to initialize KKT ${source.name}: " + e.getMessage());
        }
    }`;

    // Метод деинициализации
    const destroyMethod = `
    @PreDestroy
    public void destroy() {
        if (fptr != null) {
            fptr.close();
            fptr.destroy();
            connected = false;
            System.out.println("KKT ${source.name} destroyed");
        }
    }`;

    // Методы для всех поддерживаемых команд (возвращают результат)
    const commandMethods = `
    public boolean isConnected() {
        return connected;
    }
    
    private void checkConnection() {
        if (!connected || fptr == null) {
            throw new RuntimeException("KKT ${source.name} not connected");
        }
    }
    
    // 1. Запрос общей информации и статуса ККТ
    public String getStatus() {
        checkConnection();
        fptr.setParam(IFptr.LIBFPTR_PARAM_DATA_TYPE, IFptr.LIBFPTR_DT_STATUS);
        if (fptr.queryData() < 0) {
            return "Error: " + fptr.errorDescription();
        }
        
        StringBuilder sb = new StringBuilder();
        sb.append("KKT Status\\n");
        sb.append("Operator ID: ").append(fptr.getParamInt(IFptr.LIBFPTR_PARAM_OPERATOR_ID)).append("\\n");
        sb.append("Shift state: ").append(fptr.getParamInt(IFptr.LIBFPTR_PARAM_SHIFT_STATE)).append("\\n");
        sb.append("Shift number: ").append(fptr.getParamInt(IFptr.LIBFPTR_PARAM_SHIFT_NUMBER)).append("\\n");
        sb.append("Receipt sum: ").append(fptr.getParamDouble(IFptr.LIBFPTR_PARAM_RECEIPT_SUM)).append("\\n");
        sb.append("Cash drawer opened: ").append(fptr.getParamBool(IFptr.LIBFPTR_PARAM_CASHDRAWER_OPENED)).append("\\n");
        sb.append("Paper present: ").append(fptr.getParamBool(IFptr.LIBFPTR_PARAM_RECEIPT_PAPER_PRESENT)).append("\\n");
        sb.append("Cover opened: ").append(fptr.getParamBool(IFptr.LIBFPTR_PARAM_COVER_OPENED)).append("\\n");
        sb.append("Serial number: ").append(fptr.getParamString(IFptr.LIBFPTR_PARAM_SERIAL_NUMBER)).append("\\n");
        sb.append("Model: ").append(fptr.getParamString(IFptr.LIBFPTR_PARAM_MODEL_NAME)).append("\\n");
        sb.append("Firmware: ").append(fptr.getParamString(IFptr.LIBFPTR_PARAM_UNIT_VERSION));
        
        return sb.toString();
    }
    
    // 2. Короткий запрос статуса ККТ
    public String getShortStatus() {
        checkConnection();
        fptr.setParam(IFptr.LIBFPTR_PARAM_DATA_TYPE, IFptr.LIBFPTR_DT_SHORT_STATUS);
        if (fptr.queryData() < 0) {
            return "Error: " + fptr.errorDescription();
        }
        
        StringBuilder sb = new StringBuilder();
        sb.append("KKT Short Status\\n");
        sb.append("Cash drawer opened: ").append(fptr.getParamBool(IFptr.LIBFPTR_PARAM_CASHDRAWER_OPENED)).append("\\n");
        sb.append("Paper present: ").append(fptr.getParamBool(IFptr.LIBFPTR_PARAM_RECEIPT_PAPER_PRESENT)).append("\\n");
        sb.append("Paper near end: ").append(fptr.getParamBool(IFptr.LIBFPTR_PARAM_PAPER_NEAR_END)).append("\\n");
        sb.append("Cover opened: ").append(fptr.getParamBool(IFptr.LIBFPTR_PARAM_COVER_OPENED));
        
        return sb.toString();
    }
    
    // 3. Запрос суммы наличных в денежном ящике
    public String getCashSum() {
        checkConnection();
        fptr.setParam(IFptr.LIBFPTR_PARAM_DATA_TYPE, IFptr.LIBFPTR_DT_CASH_SUM);
        if (fptr.queryData() < 0) {
            return "Error: " + fptr.errorDescription();
        }
        return "Cash sum: " + fptr.getParamDouble(IFptr.LIBFPTR_PARAM_SUM);
    }
    
    // 4. Запрос состояния смены
    public String getShiftState() {
        checkConnection();
        fptr.setParam(IFptr.LIBFPTR_PARAM_DATA_TYPE, IFptr.LIBFPTR_DT_SHIFT_STATE);
        if (fptr.queryData() < 0) {
            return "Error: " + fptr.errorDescription();
        }
        
        long state = fptr.getParamInt(IFptr.LIBFPTR_PARAM_SHIFT_STATE);
        long number = fptr.getParamInt(IFptr.LIBFPTR_PARAM_SHIFT_NUMBER);
        String stateStr = "";
        if (state == IFptr.LIBFPTR_SS_CLOSED) stateStr = "CLOSED";
        else if (state == IFptr.LIBFPTR_SS_OPENED) stateStr = "OPENED";
        else if (state == IFptr.LIBFPTR_SS_EXPIRED) stateStr = "EXPIRED";
        
        return "Shift state: " + stateStr + ", number: " + number;
    }
    
    // 5. Открытие смены
    public String openShift() {
        checkConnection();
        fptr.setParam(IFptr.LIBFPTR_PARAM_OPERATOR_ID, 1);
        if (fptr.openShift() < 0) {
            return "Error: " + fptr.errorDescription();
        }
        return "Shift opened successfully";
    }
    
    // 6. Закрытие смены
    public String closeShift() {
        checkConnection();
        fptr.setParam(IFptr.LIBFPTR_PARAM_OPERATOR_ID, 1);
        if (fptr.close() < 0) {
            return "Error: " + fptr.errorDescription();
        }
        return "Shift closed successfully";
    }
    
    // 7. Запрос количества регистраций
    public String getRegistrationsCount() {
        return getRegistrationsCount(IFptr.LIBFPTR_RT_SELL);
    }
    
    public String getRegistrationsCount(int receiptType) {
        checkConnection();
        fptr.setParam(IFptr.LIBFPTR_PARAM_DATA_TYPE, IFptr.LIBFPTR_DT_REGISTRATIONS_COUNT);
        fptr.setParam(IFptr.LIBFPTR_PARAM_RECEIPT_TYPE, receiptType);
        if (fptr.queryData() < 0) {
            return "Error: " + fptr.errorDescription();
        }
        return "Registrations count: " + fptr.getParamInt(IFptr.LIBFPTR_PARAM_COUNT);
    }
    
    // 8. Запрос суммы регистраций
    public String getRegistrationsSum() {
        return getRegistrationsSum(IFptr.LIBFPTR_RT_SELL);
    }
    
    public String getRegistrationsSum(int receiptType) {
        checkConnection();
        fptr.setParam(IFptr.LIBFPTR_PARAM_DATA_TYPE, IFptr.LIBFPTR_DT_REGISTRATIONS_SUM);
        fptr.setParam(IFptr.LIBFPTR_PARAM_RECEIPT_TYPE, receiptType);
        if (fptr.queryData() < 0) {
            return "Error: " + fptr.errorDescription();
        }
        return "Registrations sum: " + fptr.getParamDouble(IFptr.LIBFPTR_PARAM_SUM);
    }
    
    // 9. Запрос суммы платежей
    public String getPaymentSum() {
        return getPaymentSum(IFptr.LIBFPTR_PT_CASH, IFptr.LIBFPTR_RT_SELL);
    }
    
    public String getPaymentSum(int paymentType, int receiptType) {
        checkConnection();
        fptr.setParam(IFptr.LIBFPTR_PARAM_DATA_TYPE, IFptr.LIBFPTR_DT_PAYMENT_SUM);
        fptr.setParam(IFptr.LIBFPTR_PARAM_PAYMENT_TYPE, paymentType);
        fptr.setParam(IFptr.LIBFPTR_PARAM_RECEIPT_TYPE, receiptType);
        if (fptr.queryData() < 0) {
            return "Error: " + fptr.errorDescription();
        }
        return "Payment sum: " + fptr.getParamDouble(IFptr.LIBFPTR_PARAM_SUM);
    }
    
    // 10. Запрос суммы внесений
    public String getCashInSum() {
        checkConnection();
        fptr.setParam(IFptr.LIBFPTR_PARAM_DATA_TYPE, IFptr.LIBFPTR_DT_CASHIN_SUM);
        if (fptr.queryData() < 0) {
            return "Error: " + fptr.errorDescription();
        }
        return "Cash in sum: " + fptr.getParamDouble(IFptr.LIBFPTR_PARAM_SUM);
    }
    
    // 11. Запрос суммы выплат
    public String getCashOutSum() {
        checkConnection();
        fptr.setParam(IFptr.LIBFPTR_PARAM_DATA_TYPE, IFptr.LIBFPTR_DT_CASHOUT_SUM);
        if (fptr.queryData() < 0) {
            return "Error: " + fptr.errorDescription();
        }
        return "Cash out sum: " + fptr.getParamDouble(IFptr.LIBFPTR_PARAM_SUM);
    }
    
    // 12. Запрос суммы выручки
    public String getRevenue() {
        checkConnection();
        fptr.setParam(IFptr.LIBFPTR_PARAM_DATA_TYPE, IFptr.LIBFPTR_DT_REVENUE);
        if (fptr.queryData() < 0) {
            return "Error: " + fptr.errorDescription();
        }
        return "Revenue: " + fptr.getParamDouble(IFptr.LIBFPTR_PARAM_SUM);
    }
    
    // 13. Запрос текущих даты и времени с ККТ
    public String getDateTime() {
        checkConnection();
        fptr.setParam(IFptr.LIBFPTR_PARAM_DATA_TYPE, IFptr.LIBFPTR_DT_DATE_TIME);
        if (fptr.queryData() < 0) {
            return "Error: " + fptr.errorDescription();
        }
        return "KKT Date/Time: " + fptr.getParamDateTime(IFptr.LIBFPTR_PARAM_DATE_TIME);
    }`;

    return `${packageDeclaration}
${imports}
@Component
public class ${className} {${fields}
    
${initMethod}
${destroyMethod}
${commandMethods}
}
`;
}