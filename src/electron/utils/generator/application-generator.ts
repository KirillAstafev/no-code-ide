import path from "path";
import fs from "fs/promises";

export async function addEnableSchedulingToApplicationClass(outputDir: string): Promise<void> {
    const javaBaseDir = path.join(outputDir, 'src', 'main', 'java');

    if (!javaBaseDir) {
        console.error('Java base directory not found');
        return;
    }

    let applicationClassPath: string | null = null;
    let existingClassName: string | null = null;

    async function findApplicationClass(dir: string): Promise<void> {
        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);

                if (entry.isDirectory()) {
                    await findApplicationClass(fullPath);
                } else if (entry.isFile() && entry.name.endsWith('.java')) {
                    const content = await fs.readFile(fullPath, 'utf-8');
                    if (content.includes('@SpringBootApplication')) {
                        applicationClassPath = fullPath;
                        existingClassName = entry.name.replace('.java', '');
                        return;
                    }
                }
            }
        } catch (error) {
            console.error('Error scanning directory:', error);
        }
    }

    await findApplicationClass(javaBaseDir);

    if (!applicationClassPath || !existingClassName) {
        console.error('No class with @SpringBootApplication found');
        return;
    }

    try {
        let content = await fs.readFile(applicationClassPath, 'utf-8');

        if (content.includes('@EnableScheduling')) {
            console.log('@EnableScheduling already present in ' + existingClassName + ' class');
            return;
        }

        if (content.includes('@SpringBootApplication')) {
            content = content.replace(
                /(@SpringBootApplication)(\s*)/,
                '$1\n@EnableScheduling$2'
            );

            if (!content.includes('import org.springframework.scheduling.annotation.EnableScheduling;')) {
                const importRegex = /(import .*;\n)+/;
                const importsMatch = content.match(importRegex);

                if (importsMatch) {
                    content = content.replace(
                        importRegex,
                        importsMatch[0] + 'import org.springframework.scheduling.annotation.EnableScheduling;\n'
                    );
                } else {
                    content = content.replace(
                        /(package .*;\n)/,
                        '$1\nimport org.springframework.scheduling.annotation.EnableScheduling;\n'
                    );
                }
            }

            await fs.writeFile(applicationClassPath, content, 'utf-8');
            console.log('Added @EnableScheduling to ' + existingClassName + ' class');
        } else {
            console.warn('@SpringBootApplication not found in ' + existingClassName + ' class');
        }

    } catch (error) {
        console.error('Failed to update Application class:', error);
    }
}