import path from "path";
import fs from "fs/promises";

export async function updateBuildGradle(
    outputDir: string,
    sources: DataSourceInfo[],
    basePackage: string
): Promise<void> {
    const buildGradlePath = path.join(outputDir, 'build.gradle');

    const hasKKTSources = sources.some(source =>
        source.commandName && source.commandName.startsWith('NEVA_')
    );

    if (!hasKKTSources) {
        return;
    }

    const kktDependencies = `
// Зависимости для драйвера ККТ НЕВА 03-Ф
dependencies {
    // Локальная JAR-библиотека драйвера ККТ из папки libs
    implementation fileTree(dir: 'libs', include: ['*.jar'])
}

// Настройка для подключения нативной библиотеки
bootRun {
    systemProperty "java.library.path", "libs/native"
}

test {
    systemProperty "java.library.path", "libs/native"
}
`;

    const flatDirRepo = `
    flatDir {
        dirs 'libs'
    }
`;

    try {
        let existingContent = '';
        try {
            existingContent = await fs.readFile(buildGradlePath, 'utf-8');
        } catch (error) {
            // Файл не существует, создаём базовый
            existingContent = `plugins {
    id 'java'
    id 'org.springframework.boot' version '3.2.0'
    id 'io.spring.dependency-management' version '1.1.4'
}

group = '${basePackage.replace(/\./g, '.')}'
version = '0.0.1-SNAPSHOT'

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter'
    implementation 'org.springframework.boot:spring-boot-starter-jdbc'
    implementation 'org.postgresql:postgresql'
    implementation 'org.springframework.kafka:spring-kafka'
    implementation 'org.springframework.boot:spring-boot-starter-amqp'
    implementation 'org.springframework.boot:spring-boot-starter-data-redis'
    implementation 'org.springframework.boot:spring-boot-starter-data-cassandra'
}
`;
        }

        if (existingContent.includes('fiscal_core_driver')) {
            console.log('KKT dependencies already present in build.gradle');
            return;
        }

        if (existingContent.includes('repositories {')) {
            if (!existingContent.includes('flatDir')) {
                existingContent = existingContent.replace(
                    /repositories\s*\{/,
                    `repositories {\n    mavenCentral()${flatDirRepo}`
                );
            }
        } else {
            existingContent = existingContent.replace(
                /dependencies\s*\{/,
                `repositories {\n    mavenCentral()${flatDirRepo}\n}\n\ndependencies {`
            );
        }

        if (existingContent.includes('dependencies {')) {
            if (!existingContent.includes('implementation fileTree(dir: \'libs\'')) {
                existingContent = existingContent.replace(
                    /dependencies\s*\{/,
                    `dependencies {\n    // Зависимости для драйвера ККТ НЕВА 03-Ф\n    implementation fileTree(dir: 'libs', include: ['*.jar'])`
                );
            }
        } else {
            existingContent += `\n\n${kktDependencies}`;
        }

        if (!existingContent.includes('bootRun {')) {
            existingContent += `

bootRun {
    systemProperty "java.library.path", "libs/native"
}

test {
    systemProperty "java.library.path", "libs/native"
}`;
        }

        await fs.writeFile(buildGradlePath, existingContent, 'utf-8');
        console.log('build.gradle updated with KKT driver dependencies');

    } catch (error) {
        console.error('Failed to update build.gradle:', error);
        throw error;
    }
}