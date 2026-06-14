import {generateJavaClassNameFromId, normalizeIdentifier, normalizePropertyName} from "./shared.js";

export function generateModuleServiceClass(module: ModuleInfo, basePackage: string): string {
    const className = generateJavaClassNameFromId(module.id) + 'Service';
    const packageDeclaration = `package ${basePackage};\n`;

    const imports = new Set<string>();
    imports.add('import org.springframework.stereotype.Service;');
    imports.add('import org.springframework.beans.factory.annotation.Qualifier;');
    imports.add('import org.springframework.scheduling.annotation.Scheduled;');

    const importsStr = Array.from(imports).join('\n') + '\n\n';

    let fields = '';
    let constructorParams = '';
    let constructorAssignments = '';

    module.destinationConnections.forEach((destination, index) => {
        const fieldName = `${normalizePropertyName(destination.destinationName.toLowerCase())}Client`;
        const qualifierName = normalizePropertyName(destination.destinationName);
        const beanName = `${qualifierName}Client`;

        fields += `    private final ${destination.className} ${fieldName};\n`;

        if (index > 0) {
            constructorParams += ', ';
            constructorAssignments += '\n';
        }
        constructorParams += `@Qualifier("${beanName}") ${destination.className} ${fieldName}`;
        constructorAssignments += `        this.${fieldName} = ${fieldName};`;
    });

    let sourceFields = '';
    let sourceConstructorParams = '';
    let sourceConstructorAssignments = '';

    module.sourceConnections.forEach((source, index) => {
        const fieldName = `${normalizePropertyName(source.sourceName)}Source`;
        const sourceClassName = `${normalizeIdentifier(source.sourceName)}Source`;
        const beanName = `${normalizePropertyName(source.sourceName)}Source`;

        sourceFields += `    private final ${sourceClassName} ${fieldName};\n`;

        if (index > 0) {
            sourceConstructorParams += ', ';
            sourceConstructorAssignments += '\n';
        }
        sourceConstructorParams += `@Qualifier("${beanName}") ${sourceClassName} ${fieldName}`;
        sourceConstructorAssignments += `        this.${fieldName} = ${fieldName};`;
    });

    let sourceMethods = '';
    module.sourceConnections.forEach(source => {
        const methodName = `processDataFrom${generateJavaClassNameFromId(source.id)}`;
        const sourceField = `${normalizePropertyName(source.sourceName)}Source`;
        const commandName = source.commandName;

        sourceMethods += `
    @Scheduled(fixedRate = 10000)
    public void ${methodName}() {
        System.out.println("${commandName} - ${methodName} calling ${normalizeIdentifier(source.sourceName)}");
        
        if (!${sourceField}.isConnected()) {
            System.err.println("KKT ${normalizeIdentifier(source.sourceName)} not connected");
            return;
        }
        
        String result = "";`;

        switch (commandName) {
            case "NEVA_GET_STATUS":
                sourceMethods += `
        result = ${sourceField}.getStatus();`;
                break;
            case "NEVA_GET_SHORT_STATUS":
                sourceMethods += `
        result = ${sourceField}.getShortStatus();`;
                break;
            case "NEVA_GET_CASH_SUM":
                sourceMethods += `
        result = ${sourceField}.getCashSum();`;
                break;
            case "NEVA_GET_SHIFT_STATE":
                sourceMethods += `
        result = ${sourceField}.getShiftState();`;
                break;
            case "NEVA_OPEN_SHIFT":
                sourceMethods += `
        result = ${sourceField}.openShift();`;
                break;
            case "NEVA_CLOSE_SHIFT":
                sourceMethods += `
        result = ${sourceField}.closeShift();`;
                break;
            case "NEVA_GET_REGISTRATIONS_COUNT":
                sourceMethods += `
        result = ${sourceField}.getRegistrationsCount();`;
                break;
            case "NEVA_GET_REGISTRATIONS_SUM":
                sourceMethods += `
        result = ${sourceField}.getRegistrationsSum();`;
                break;
            case "NEVA_GET_PAYMENT_SUM":
                sourceMethods += `
        result = ${sourceField}.getPaymentSum();`;
                break;
            case "NEVA_GET_CASHIN_SUM":
                sourceMethods += `
        result = ${sourceField}.getCashInSum();`;
                break;
            case "NEVA_GET_CASHOUT_SUM":
                sourceMethods += `
        result = ${sourceField}.getCashOutSum();`;
                break;
            case "NEVA_GET_REVENUE":
                sourceMethods += `
        result = ${sourceField}.getRevenue();`;
                break;
            case "NEVA_GET_DATE_TIME":
                sourceMethods += `
        result = ${sourceField}.getDateTime();`;
                break;
            default:
                sourceMethods += `
        result = "Unknown command: ${commandName}";`;
        }

        sourceMethods += `
        System.out.println("Command result: " + result);
        
        `;

        module.destinationConnections.forEach(destination => {
            const sendMethod = `sendDataTo${generateJavaClassNameFromId(destination.id)}`;
            sourceMethods += `
        ${sendMethod}(result);`;
        });

        sourceMethods += `
    }`;
    });

    let destinationMethods = '';
    module.destinationConnections.forEach(destination => {
        const methodName = `sendDataTo${generateJavaClassNameFromId(destination.id)}`;
        const clientField = `${normalizePropertyName(destination.destinationName.toLowerCase())}Client`;

        destinationMethods += `
    public void ${methodName}(String data) {
        ${clientField}.sendData(data);
    }`;
    });

    const allConstructorParams = constructorParams + (sourceConstructorParams ? (constructorParams ? ', ' : '') + sourceConstructorParams : '');
    const allConstructorAssignments = constructorAssignments + (sourceConstructorAssignments ? '\n' + sourceConstructorAssignments : '');

    return `${packageDeclaration}${importsStr}
@Service
public class ${className} {
${fields}${sourceFields}
    
    public ${className}(${allConstructorParams}) {
${allConstructorAssignments}
    }
${sourceMethods}
${destinationMethods}
}
`;
}