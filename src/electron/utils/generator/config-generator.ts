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
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import javax.sql.DataSource;\n`;

    let beans = '';

    destinations.forEach(dest => {
        const destName = normalizePropertyName(dest.destinationName);
        const pgSettings = dest.postgresql;
        const host = dest?.destinationUrl.split(":")[0].trim() || 'localhost';
        const port = dest?.destinationUrl.split(":")[1].trim() || 5432;
        const database = pgSettings?.databaseName || 'postgres';
        const username = pgSettings?.username || 'postgres';
        const password = pgSettings?.password || '';

        beans += `
    @Bean(name = "${destName}DataSource")
    public DataSource ${destName}DataSource() {
        return DataSourceBuilder.create()
            .url("jdbc:postgresql://${host}:${port}/${database}")
            .username("${username}")
            .password("${password}")
            .driverClassName("org.postgresql.Driver")
            .build();
    }
    
    @Bean(name = "${destName}JdbcTemplate")
    public JdbcTemplate ${destName}JdbcTemplate(
            @Qualifier("${destName}DataSource") DataSource dataSource) {
        return new JdbcTemplate(dataSource);
    }
`;
    });

    return `${packageDeclaration}
${imports}
@Configuration
public class PostgreSQLConfig {${beans}
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
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;
import java.util.HashMap;
import java.util.Map;\n`;

    let beans = '';

    destinations.forEach(dest => {
        const destName = normalizePropertyName(dest.destinationName);
        const bootstrapServers = dest.destinationUrl || 'localhost:9092';

        beans += `
    @Bean(name = "${destName}ProducerFactory")
    public ProducerFactory<String, String> ${destName}ProducerFactory() {
        Map<String, Object> configProps = new HashMap<>();
        configProps.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "${bootstrapServers}");
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
    }
`;
    });

    return `${packageDeclaration}
${imports}
@Configuration
public class KafkaConfig {${beans}
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
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;\n`;

    let beans = '';

    destinations.forEach(dest => {
        const destName = normalizePropertyName(dest.destinationName);
        const urlParts = dest.destinationUrl.split(':');
        const host = urlParts[0] || 'localhost';
        const port = parseInt(urlParts[1]) || 5672;
        const queueName = dest.rabbitmq?.queueName || `queue-${destName}`;

        beans += `
    @Bean(name = "${destName}ConnectionFactory")
    public ConnectionFactory ${destName}ConnectionFactory() {
        CachingConnectionFactory connectionFactory = new CachingConnectionFactory("${host}", ${port});
        return connectionFactory;
    }
    
    @Bean(name = "${destName}RabbitTemplate")
    public RabbitTemplate ${destName}RabbitTemplate(
            @Qualifier("${destName}ConnectionFactory") ConnectionFactory connectionFactory) {
        return new RabbitTemplate(connectionFactory);
    }
    
    @Bean(name = "${destName}Queue")
    public Queue ${destName}Queue() {
        return new Queue("${queueName}", true);
    }
`;
    });

    return `${packageDeclaration}
${imports}
@Configuration
public class RabbitMQConfig {${beans}
}
`;
}

function generateRedisConfig(
    destinations: DestinationConnectionInfo[],
    basePackage: string
): string {
    const packageDeclaration = `package ${basePackage}.config;\n`;

    const imports = `import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.StringRedisSerializer;\n`;

    let beans = '';

    destinations.forEach(dest => {
        const destName = normalizePropertyName(dest.destinationName);
        const urlParts = dest.destinationUrl.split(':');
        const host = urlParts[0] || 'localhost';
        const port = parseInt(urlParts[1]) || 6379;

        beans += `
    @Bean(name = "${destName}RedisConnectionFactory")
    public LettuceConnectionFactory ${destName}RedisConnectionFactory() {
        RedisStandaloneConfiguration config = new RedisStandaloneConfiguration();
        config.setHostName("${host}");
        config.setPort(${port});
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
    }
`;
    });

    return `${packageDeclaration}
${imports}
@Configuration
public class RedisConfig {${beans}
}
`;
}

function generateCassandraConfig(
    destinations: DestinationConnectionInfo[],
    basePackage: string
): string {
    const packageDeclaration = `package ${basePackage}.config;\n`;

    const imports = `import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.cassandra.core.CassandraTemplate;
import com.datastax.oss.driver.api.core.CqlSession;
import java.net.InetSocketAddress;\n`;

    let beans = '';

    destinations.forEach(dest => {
        const destName = normalizePropertyName(dest.destinationName);
        const contactPoints = dest.destinationUrl.split(',');

        beans += `
    @Bean(name = "${destName}CassandraSession")
    public CqlSession ${destName}CassandraSession() {
        return CqlSession.builder()
            .addContactPoints(${contactPoints.map(cp => `new InetSocketAddress("${cp.trim()}", 9042)`).join(', ')})
            .withLocalDatacenter("datacenter1")
            .build();
    }
    
    @Bean(name = "${destName}CassandraTemplate")
    public CassandraTemplate ${destName}CassandraTemplate(
            @Qualifier("${destName}CassandraSession") CqlSession session) {
        return new CassandraTemplate(session);
    }
`;
    });

    return `${packageDeclaration}
${imports}
@Configuration
public class CassandraConfig {${beans}
}
`;
}