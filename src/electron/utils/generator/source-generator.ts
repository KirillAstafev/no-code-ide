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
import ru.neva.drivers.fptr.IFptr;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Random;`;

    const fields = `
    private IFptr fptr;
    private boolean connected = false;
    private final Random random = new Random();
    
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

    // Методы для всех поддерживаемых команд (возвращают тестовые значения)
    const commandMethods = `
    public boolean isConnected() {
        return true;
    }
    
    private void checkConnection() {
        // В тестовом режиме всегда считаем подключение успешным
    }
    
    // 1. Запрос общей информации и статуса ККТ
    public String getStatus() {
        return String.format("""
            KKT Status
            Operator ID: %d
            Shift state: %d
            Shift number: %d
            Receipt sum: %.2f
            Cash drawer opened: %s
            Paper present: %s
            Cover opened: %s
            Serial number: %s
            Model: %s
            Firmware: %s
            """,
            1,
            IFptr.LIBFPTR_SS_OPENED,
            random.nextInt(100) + 1,
            12500.75 + random.nextDouble() * 5000,
            random.nextBoolean(),
            true,
            false,
            "NEVA-03F-" + (100000 + random.nextInt(900000)),
            "NEVA-03-F",
            "v1." + (10 + random.nextInt(10)) + "." + random.nextInt(20)
        );
    }
    
    // 2. Короткий запрос статуса ККТ
    public String getShortStatus() {
        return String.format("""
            KKT Short Status
            Cash drawer opened: %s
            Paper present: %s
            Paper near end: %s
            Cover opened: %s
            """,
            random.nextBoolean(),
            true,
            random.nextDouble() < 0.1,
            false
        );
    }
    
    // 3. Запрос суммы наличных в денежном ящике
    public String getCashSum() {
        return String.format("Cash sum: %.2f", 50000.00 + random.nextDouble() * 30000);
    }
    
    // 4. Запрос состояния смены
    public String getShiftState() {
        long state = IFptr.LIBFPTR_SS_OPENED;
        long number = random.nextInt(500) + 1;
        String stateStr = "OPENED";
        return "Shift state: " + stateStr + ", number: " + number;
    }
    
    // 5. Открытие смены
    public String openShift() {
        return "Shift opened successfully";
    }
    
    // 6. Закрытие смены
    public String closeShift() {
        return "Shift closed successfully";
    }
    
    // 7. Запрос количества регистраций
    public String getRegistrationsCount() {
        return getRegistrationsCount(IFptr.LIBFPTR_RT_SELL);
    }
    
    public String getRegistrationsCount(int receiptType) {
        return String.format("Registrations count: %d", random.nextInt(150) + 10);
    }
    
    // 8. Запрос суммы регистраций
    public String getRegistrationsSum() {
        return getRegistrationsSum(IFptr.LIBFPTR_RT_SELL);
    }
    
    public String getRegistrationsSum(int receiptType) {
        return String.format("Registrations sum: %.2f", 8500.50 + random.nextDouble() * 10000);
    }
    
    // 9. Запрос суммы платежей
    public String getPaymentSum() {
        return getPaymentSum(IFptr.LIBFPTR_PT_CASH, IFptr.LIBFPTR_RT_SELL);
    }
    
    public String getPaymentSum(int paymentType, int receiptType) {
        String paymentTypeName = paymentType == IFptr.LIBFPTR_PT_CASH ? "Cash" : "Card";
        return String.format("Payment sum (%s): %.2f", paymentTypeName, 12500.75 + random.nextDouble() * 8000);
    }
    
    // 10. Запрос суммы внесений
    public String getCashInSum() {
        return String.format("Cash in sum: %.2f", 15000.00 + random.nextDouble() * 10000);
    }
    
    // 11. Запрос суммы выплат
    public String getCashOutSum() {
        return String.format("Cash out sum: %.2f", 3000.00 + random.nextDouble() * 5000);
    }
    
    // 12. Запрос суммы выручки
    public String getRevenue() {
        return String.format("Revenue: %.2f", 25000.00 + random.nextDouble() * 15000);
    }
    
    // 13. Запрос текущих даты и времени с ККТ
    public String getDateTime() {
        LocalDateTime now = LocalDateTime.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm:ss");
        return "KKT Date/Time: " + now.format(formatter);
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