import fs from 'fs';
import path from 'path';

const rootDir = path.resolve(process.cwd());

const updateForms = (appDir) => {
  const loginPath = path.join(rootDir, appDir, 'src/components/auth/LoginForm.tsx');
  const registerPath = path.join(rootDir, appDir, 'src/components/auth/RegisterForm.tsx');

  if (fs.existsSync(loginPath)) {
    let content = fs.readFileSync(loginPath, 'utf8');
    const schemaBlock = `const loginSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

type LoginFormValues = z.infer<typeof loginSchema>;`;
    
    // Fallback if formatting is slightly different
    const regex = /const loginSchema = z\.object\(\{[\s\S]+?type LoginFormValues = z\.infer<typeof loginSchema>;/m;
    
    if (content.includes(schemaBlock)) {
      content = content.replace(schemaBlock, '');
    } else if (regex.test(content)) {
      content = content.replace(regex, '');
    }
    
    content = content.replace(/import \* as z from "zod";\r?\n?/, '');
    
    // add import to top
    if (!content.includes(`import { loginSchema, type LoginFormValues }`)) {
      content = `import { loginSchema, type LoginFormValues } from '@mandys/shared';\n` + content;
    }
    
    fs.writeFileSync(loginPath, content);
    console.log(`Updated ${loginPath}`);
  }

  if (fs.existsSync(registerPath)) {
    let content = fs.readFileSync(registerPath, 'utf8');
    const regex = /\/\/ Define strict validation rules\r?\n?const registerSchema = z\.object\(\{[\s\S]+?type RegisterFormValues = z\.infer<typeof registerSchema>;/m;
    
    const regexWithoutComment = /const registerSchema = z\.object\(\{[\s\S]+?type RegisterFormValues = z\.infer<typeof registerSchema>;/m;

    if (regex.test(content)) {
      content = content.replace(regex, '');
    } else if (regexWithoutComment.test(content)) {
       content = content.replace(regexWithoutComment, '');
    }
    
    content = content.replace(/import \* as z from "zod";\r?\n?/, '');
    
    if (!content.includes(`import { registerSchema, type RegisterFormValues }`)) {
      content = `import { registerSchema, type RegisterFormValues } from '@mandys/shared';\n` + content;
    }
    
    fs.writeFileSync(registerPath, content);
    console.log(`Updated ${registerPath}`);
  }
};

updateForms('apps/client');
updateForms('apps/admin');

// Update packages/shared/index.ts
let indexContent = fs.readFileSync(path.join(rootDir, 'packages/shared/index.ts'), 'utf8');
if (!indexContent.includes(`export * from './src/validators/auth'`)) {
  indexContent += `export * from './src/validators/auth';\n`;
  fs.writeFileSync(path.join(rootDir, 'packages/shared/index.ts'), indexContent);
}

console.log('Schemas extraction complete!');
