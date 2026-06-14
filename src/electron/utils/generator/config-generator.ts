import {normalizePropertyName} from "./shared.js";

export function generateConfigurationClasses(
    destinations: DestinationConnectionInfo[],
    basePackage: string
): Record<string, string> {
    const configs: Record<string, string> = {};

    const postgresqlDests = destinations.filter(d => d.targetType === 'POSTGRESQL');
    if (postgresqlDests.length > 0) {
        configs['PostgreSQLConfig.java'] = generatePostgreSQLConfig(postgresqlDests, basePackage);
    }

    const kafkaDests = destinations.filter(d => d.targetType === 'KAFKA');
    if (kafkaDests.length > 0) {
        configs['KafkaConfig.java'] = generateKafkaConfig(kafkaDests, basePackage);
    }

    const rabbitmqDests = destinations.filter(d => d.targetType === 'RABBITMQ');
    if (rabbitmqDests.length > 0) {
        configs['RabbitMQConfig.java'] = generateRabbitMQConfig(rabbitmqDests, basePackage);
    }

    const redisDests = destinations.filter(d => d.targetType === 'REDIS');
    if (redisDests.length > 0) {
        configs['RedisConfig.java'] = generateRedisConfig(redisDests, basePackage);
    }

    const cassandraDests = destinations.filter(d => d.targetType === 'CASSANDRA');
    if (cassandraDests.length > 0) {
        configs['CassandraConfig.java'] = generateCassandraConfig(cassandraDests, basePackage);
    }

    return configs;
}

function generatePostgreSQLConfig(
    destinations: DestinationConnectionInfo[],
    basePackage: string
): string {
    const packageDeclaration = `package ${basePackage}.config;\n`;

    const imports = `import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;
import org.springframework.jdbc.core.JdbcTemplate;
import javax.sql.DataSource;\n`;

    let beans = '';
    let propertiesFields = '';

    destinations.forEach(dest => {
        const destName = normalizePropertyName(dest.destinationName);

        propertiesFields += `
    @Value("${"$"}{app.postgresql.${destName}.host}")
    private String ${destName}Host;
    
    @Value("${"$"}{app.postgresql.${destName}.port}")
    private int ${destName}Port;
    
    @Value("${"$"}{app.postgresql.${destName}.database}")
    private String ${destName}Database;
    
    @Value("${"$"}{app.postgresql.${destName}.schema:public}")
    private String ${destName}Schema;
    
    @Value("${"$"}{app.postgresql.${destName}.username}")
    private String ${destName}Username;
    
    @Value("${"$"}{app.postgresql.${destName}.password}")
    private String ${destName}Password;`;

        beans += `
    @Bean(name = "${destName}DataSource")
    public DataSource ${destName}DataSource() {
        return DataSourceBuilder.create()
            .url(String.format("jdbc:postgresql://%s:%s/%s?currentSchema=%s", ${destName}Host, ${destName}Port, ${destName}Database, ${destName}Schema))
            .username(${destName}Username)
            .password(${destName}Password)
            .driverClassName("org.postgresql.Driver")
            .build();
    }
    
    @Bean(name = "${destName}JdbcTemplate")
    public JdbcTemplate ${destName}JdbcTemplate(
            @Qualifier("${destName}DataSource") DataSource dataSource) {
        return new JdbcTemplate(dataSource);
    }`;
    });

    return `${packageDeclaration}
${imports}
@Configuration
public class PostgreSQLConfig {${propertiesFields}
    
${beans}
}
`;
}

function generateKafkaConfig(
    destinations: DestinationConnectionInfo[],
    basePackage: string
): string {
    const packageDeclaration = `package ${basePackage}.config;\n`;

    const imports = `import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;
import java.util.HashMap;
import java.util.Map;\n`;

    let beans = '';
    let propertiesFields = '';

    destinations.forEach(dest => {
        const destName = normalizePropertyName(dest.destinationName);

        propertiesFields += `
    @Value("${"$"}{app.kafka.${destName}.bootstrap-servers}")
    private String ${destName}BootstrapServers;`;

        beans += `
    @Bean(name = "${destName}ProducerFactory")
    public ProducerFactory<String, String> ${destName}ProducerFactory() {
        Map<String, Object> configProps = new HashMap<>();
        configProps.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, ${destName}BootstrapServers);
        configProps.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        configProps.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        configProps.put(ProducerConfig.ACKS_CONFIG, "all");
        configProps.put(ProducerConfig.RETRIES_CONFIG, 3);
        return new DefaultKafkaProducerFactory<>(configProps);
    }
    
    @Bean(name = "${destName}KafkaTemplate")
    public KafkaTemplate<String, String> ${destName}KafkaTemplate(
            @Qualifier("${destName}ProducerFactory") ProducerFactory<String, String> producerFactory) {
        return new KafkaTemplate<>(producerFactory);
    }`;
    });

    return `${packageDeclaration}
${imports}
@Configuration
public class KafkaConfig {${propertiesFields}
    
${beans}
}
`;
}

function generateRabbitMQConfig(
    destinations: DestinationConnectionInfo[],
    basePackage: string
): string {
    const packageDeclaration = `package ${basePackage}.config;\n`;

    const imports = `import org.springframework.amqp.core.Queue;
import org.springframework.amqp.rabbit.connection.CachingConnectionFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;\n`;

    let beans = '';
    let propertiesFields = '';

    destinations.forEach(dest => {
        const destName = normalizePropertyName(dest.destinationName);

        propertiesFields += `
    @Value("${"$"}{spring.rabbitmq.${destName}.host:localhost}")
    private String ${destName}Host;
    
    @Value("${"$"}{spring.rabbitmq.${destName}.port:5672}")
    private int ${destName}Port;
    
    @Value("${"$"}{app.rabbitmq.${destName}.queue:default-queue}")
    private String ${destName}QueueName;
    
    @Value("${"$"}{app.rabbitmq.${destName}.exchange:}")
    private String ${destName}ExchangeName;
    
    @Value("${"$"}{app.rabbitmq.${destName}.routing-key:}")
    private String ${destName}RoutingKey;`;

        beans += `
    @Bean(name = "${destName}ConnectionFactory")
    public ConnectionFactory ${destName}ConnectionFactory() {
        CachingConnectionFactory connectionFactory = new CachingConnectionFactory(${destName}Host, ${destName}Port);
        return connectionFactory;
    }
    
    @Bean(name = "${destName}RabbitTemplate")
    public RabbitTemplate ${destName}RabbitTemplate(
            @Qualifier("${destName}ConnectionFactory") ConnectionFactory connectionFactory) {
        return new RabbitTemplate(connectionFactory);
    }
    
    @Bean(name = "${destName}Queue")
    public Queue ${destName}Queue() {
        return new Queue(${destName}QueueName, true);
    }`;
    });

    return `${packageDeclaration}
${imports}
@Configuration
public class RabbitMQConfig {${propertiesFields}
    
${beans}
}
`;
}

function generateRedisConfig(
    destinations: DestinationConnectionInfo[],
    basePackage: string
): string {
    const packageDeclaration = `package ${basePackage}.config;\n`;

    const imports = `import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.StringRedisSerializer;\n`;

    let beans = '';
    let propertiesFields = '';

    destinations.forEach(dest => {
        const destName = normalizePropertyName(dest.destinationName);

        propertiesFields += `
    @Value("${"$"}{spring.redis.${destName}.host:localhost}")
    private String ${destName}Host;
    
    @Value("${"$"}{spring.redis.${destName}.port:6379}")
    private int ${destName}Port;`;

        beans += `
    @Bean(name = "${destName}RedisConnectionFactory")
    public LettuceConnectionFactory ${destName}RedisConnectionFactory() {
        RedisStandaloneConfiguration config = new RedisStandaloneConfiguration();
        config.setHostName(${destName}Host);
        config.setPort(${destName}Port);
        return new LettuceConnectionFactory(config);
    }
    
    @Bean(name = "${destName}RedisTemplate")
    public RedisTemplate<String, String> ${destName}RedisTemplate(
            @Qualifier("${destName}RedisConnectionFactory") LettuceConnectionFactory connectionFactory) {
        RedisTemplate<String, String> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(new StringRedisSerializer());
        return template;
    }`;
    });

    return `${packageDeclaration}
${imports}
@Configuration
public class RedisConfig {${propertiesFields}
    
${beans}
}
`;
}

function generateCassandraConfig(
    destinations: DestinationConnectionInfo[],
    basePackage: string
): string {
    const packageDeclaration = `package ${basePackage}.config;\n`;

    const imports = `import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;
import org.springframework.data.cassandra.core.CassandraTemplate;
import com.datastax.oss.driver.api.core.CqlSession;
import java.net.InetSocketAddress;\n`;

    let beans = '';
    let propertiesFields = '';

    destinations.forEach(dest => {
        const destName = normalizePropertyName(dest.destinationName);

        propertiesFields += `
    @Value("${"$"}{spring.data.cassandra.${destName}.contact-points:localhost}")
    private String ${destName}ContactPoints;
    
    @Value("${"$"}{spring.data.cassandra.${destName}.port:9042}")
    private int ${destName}Port;
    
    @Value("${"$"}{spring.data.cassandra.${destName}.keyspace:default_keyspace}")
    private String ${destName}Keyspace;`;

        beans += `
    @Bean(name = "${destName}CassandraSession")
    public CqlSession ${destName}CassandraSession() {
        return CqlSession.builder()
            .addContactPoints(${destName}ContactPoints.split(',').map(cp -> new InetSocketAddress(cp.trim(), ${destName}Port)).toArray(InetSocketAddress[]::new))
            .withLocalDatacenter("datacenter1")
            .build();
    }
    
    @Bean(name = "${destName}CassandraTemplate")
    public CassandraTemplate ${destName}CassandraTemplate(
            @Qualifier("${destName}CassandraSession") CqlSession session) {
        return new CassandraTemplate(session);
    }`;
    });

    return `${packageDeclaration}
${imports}
@Configuration
public class CassandraConfig {${propertiesFields}
    
${beans}
}
`;
}