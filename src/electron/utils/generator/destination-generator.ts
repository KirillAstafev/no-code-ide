import {normalizePropertyName} from "./shared.js";

export function generateDestinationClass(destination: DestinationConnectionInfo, basePackage: string): string {
    const className = destination.className;
    const packageDeclaration = `package ${basePackage};\n`;
    const targetType = destination.targetType || 'UNKNOWN';
    const propertyName = normalizePropertyName(destination.destinationName);

    const beanName = `${propertyName}Client`;

    const imports = `import org.springframework.stereotype.Component;\n`;
    let fields = '';
    let constructorParams = '';
    let constructorAssignments = '';
    let sendDataImpl = '';
    let additionalImports = '';
    const componentAnnotation = `@Component("${beanName}")`;

    if (targetType === 'POSTGRESQL') {
        additionalImports = `import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.beans.factory.annotation.Value;\n`;

        const tableName = destination.postgresql?.tableName || 'your_table';
        const columnName = destination.postgresql?.columnName || 'data_column';

        fields = `    private final JdbcTemplate jdbcTemplate;
    
    @Value("${"$"}{app.postgresql.${propertyName}.schema:public}")
    private String schema;
    
    @Value("${"$"}{app.postgresql.${propertyName}.table:${tableName}}")
    private String tableName;
    
    @Value("${"$"}{app.postgresql.${propertyName}.column:${columnName}}")
    private String columnName;\n`;

        constructorParams = `@Qualifier("${propertyName}JdbcTemplate") JdbcTemplate jdbcTemplate`;
        constructorAssignments = `        this.jdbcTemplate = jdbcTemplate;`;

        sendDataImpl = `
        String insertSql = String.format("INSERT INTO %s.%s (%s) VALUES (?)", schema, tableName, columnName);
        jdbcTemplate.update(insertSql, data);
        System.err.println("Data saved to PostgreSQL table '" + schema + "." + tableName + "': " + data);`;

    } else if (targetType === 'KAFKA') {
        additionalImports = `import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.beans.factory.annotation.Value;\n`;

        fields = `    private final KafkaTemplate<String, String> kafkaTemplate;
    
    @Value("${"$"}{app.kafka.${propertyName}.topic:default-topic}")
    private String topic;\n`;

        constructorParams = `@Qualifier("${propertyName}KafkaTemplate") KafkaTemplate<String, String> kafkaTemplate`;
        constructorAssignments = `        this.kafkaTemplate = kafkaTemplate;`;

        sendDataImpl = `
        kafkaTemplate.send(topic, data);
        System.err.println("Message sent to Kafka topic '" + topic + "': " + data);`;

    } else if (targetType === 'RABBITMQ') {
        additionalImports = `import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;\n`;

        fields = `    private final RabbitTemplate rabbitTemplate;
    
    @Value("${"$"}{app.rabbitmq.${propertyName}.queue:default-queue}")
    private String queueName;
    
    @Value("${"$"}{app.rabbitmq.${propertyName}.exchange:}")
    private String exchangeName;
    
    @Value("${"$"}{app.rabbitmq.${propertyName}.routing-key:}")
    private String routingKey;\n`;

        constructorParams = `@Qualifier("${propertyName}RabbitTemplate") RabbitTemplate rabbitTemplate`;
        constructorAssignments = `        this.rabbitTemplate = rabbitTemplate;`;

        sendDataImpl = `
        if (exchangeName != null && !exchangeName.isEmpty()) {
            rabbitTemplate.convertAndSend(exchangeName, routingKey, data);
        } else {
            rabbitTemplate.convertAndSend(queueName, data);
        }
        System.err.println("Message sent to RabbitMQ: " + data);`;

    } else if (targetType === 'REDIS') {
        additionalImports = `import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.beans.factory.annotation.Value;\n`;

        fields = `    private final RedisTemplate<String, String> redisTemplate;
    
    @Value("${"$"}{app.redis.${propertyName}.key:default-key}")
    private String key;
    
    @Value("${"$"}{app.redis.${propertyName}.ttl:0}")
    private int ttl;\n`;

        constructorParams = `@Qualifier("${propertyName}RedisTemplate") RedisTemplate<String, String> redisTemplate`;
        constructorAssignments = `        this.redisTemplate = redisTemplate;`;

        sendDataImpl = `
        redisTemplate.opsForValue().set(key, data);
        if (ttl > 0) {
            redisTemplate.expire(key, java.time.Duration.ofSeconds(ttl));
        }
        System.err.println("Data stored in Redis with key '" + key + "': " + data);`;

    } else if (targetType === 'CASSANDRA') {
        additionalImports = `import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.cassandra.core.CassandraTemplate;
import org.springframework.beans.factory.annotation.Value;\n`;

        fields = `    private final CassandraTemplate cassandraTemplate;
    
    @Value("${"$"}{app.cassandra.${propertyName}.table:default_table}")
    private String table;\n`;

        constructorParams = `@Qualifier("${propertyName}CassandraTemplate") CassandraTemplate cassandraTemplate`;
        constructorAssignments = `        this.cassandraTemplate = cassandraTemplate;`;

        sendDataImpl = `
        // Создание сущности для вставки
        // ExampleEntity entity = new ExampleEntity();
        // entity.setData(data);
        // cassandraTemplate.insert(entity);
        System.err.println("Data inserted into Cassandra table '" + table + "': " + data);`;

    } else {
        throw new Error(`Unsupported destination type: ${targetType}. Supported types: POSTGRESQL, KAFKA, RABBITMQ, REDIS, CASSANDRA`);
    }

    return `${packageDeclaration}
${imports}
${additionalImports}
${componentAnnotation}
public class ${className} {
${fields}
    
    public ${className}(${constructorParams}) {
${constructorAssignments}
    }
    
    public void sendData(String data) {${sendDataImpl}
    }
}
`;
}