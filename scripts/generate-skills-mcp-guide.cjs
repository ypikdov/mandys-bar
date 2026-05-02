const fs = require("fs");
const path = require("path");
const {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  LevelFormat,
  Packer,
  PageBreak,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableOfContents,
  TableRow,
  TextRun,
  WidthType,
} = require("docx");

const repoRoot = path.resolve(__dirname, "..");
const outputPath = path.join(repoRoot, "docs", "guia-practica-skills-y-mcp-equipo.docx");

const skills = [
  {
    name: "webapp-testing",
    purpose: "Probar apps web en navegador real, revisar flujos, errores visuales y comportamiento UI.",
    whenUse: "Cuando ya existe una app o pantalla y quieres validar que funcione de verdad.",
    activation: "Se activa al pedir pruebas de navegador, QA visual o debugging de una web local.",
    example: "Prueba login, carrito y formulario de reservas en local y dime que falla.",
    limits: "No reemplaza diseno ni arquitectura; valida y depura una interfaz ya construida.",
  },
  {
    name: "frontend-design",
    purpose: "Construir interfaces frontend con buen nivel visual, jerarquia clara y codigo usable.",
    whenUse: "Cuando vas a crear paginas, dashboards, componentes o una app nueva.",
    activation: "Se activa al pedir una interfaz, una pagina o una mejora fuerte de UI/UX.",
    example: "Crea una pantalla de dashboard moderna para administradores.",
    limits: "No es una skill de seguridad ni de pruebas automatizadas.",
  },
  {
    name: "playwright-interactive",
    purpose: "Depurar UI de forma iterativa con navegador persistente y ciclos rapidos de prueba.",
    whenUse: "Cuando el bug solo aparece tras varias interacciones o estados de la interfaz.",
    activation: "Se activa al pedir debugging interactivo o inspeccion continua de una app en navegador.",
    example: "Abre la app y revisa por que el modal se rompe despues del segundo click.",
    limits: "Sirve para depuracion; no es una guia de diseno ni un flujo de producto.",
  },
  {
    name: "recent-code-bugfix",
    purpose: "Buscar y corregir un bug introducido por commits recientes del autor actual.",
    whenUse: "Cuando algo se rompio despues de cambios recientes y quieres un fix puntual.",
    activation: "Se activa al pedir triage de commits recientes o cuando quieres detectar un bug recien introducido.",
    example: "Revisa mis commits de las ultimas 24 horas y corrige un bug real.",
    limits: "No sirve para refactors generales ni para bugs viejos no ligados a cambios recientes.",
  },
  {
    name: "figma",
    purpose: "Leer contexto real desde Figma: frames, nodos, variables, assets y estructura visual.",
    whenUse: "Cuando existe un archivo de Figma y necesitas inspeccionarlo antes de implementar.",
    activation: "Se activa cuando das un link o nodo de Figma y el servidor MCP de Figma esta conectado.",
    example: "Lee este frame de Figma y dime su estructura y componentes.",
    limits: "Sin Figma conectado no puede leer el archivo real; solo puede apoyarse en capturas o descripcion.",
  },
  {
    name: "figma-implement-design",
    purpose: "Traducir un diseno de Figma a codigo con alta fidelidad visual.",
    whenUse: "Cuando ya existe el diseno y quieres implementarlo en React, HTML o Tailwind.",
    activation: "Se activa al pedir implementacion directa desde Figma con MCP funcional.",
    example: "Implementa este frame de Figma en React y Tailwind.",
    limits: "Depende de tener acceso real al archivo de Figma; sin eso baja a aproximacion.",
  },
  {
    name: "frontend-skill",
    purpose: "Empujar una direccion visual mas fuerte: composicion, branding, hero y look premium.",
    whenUse: "Cuando una interfaz necesita mas personalidad visual y menos apariencia generica.",
    activation: "Se activa al pedir una landing, una experiencia visual fuerte o una UI con mas art direction.",
    example: "Haz una homepage con look premium y composicion fuerte.",
    limits: "No sustituye testing ni backend; su fuerte es la direccion visual.",
  },
  {
    name: "develop-web-game",
    purpose: "Desarrollar experiencias tipo juego en web con bucles rapidos de prueba y ajuste.",
    whenUse: "Cuando hay minijuegos, ejercicios gamificados, drag-and-drop o mecanicas interactivas.",
    activation: "Se activa al pedir una web con dinamica de juego o una experiencia educativa gamificada.",
    example: "Crea un juego web de emparejar conceptos con feedback rapido.",
    limits: "No es necesaria para una app web comun sin logica tipo juego.",
  },
  {
    name: "chatgpt-apps",
    purpose: "Crear apps para el ecosistema ChatGPT Apps SDK con UI y herramientas conectadas.",
    whenUse: "Cuando el producto final va a vivir dentro del ecosistema de ChatGPT.",
    activation: "Se activa al pedir una app basada en Apps SDK o integracion nativa con ChatGPT.",
    example: "Scaffold una app para ChatGPT con herramientas y widget UI.",
    limits: "No aporta a una web normal si no vas a usar el ecosistema ChatGPT.",
  },
  {
    name: "security-threat-model",
    purpose: "Analizar amenazas, activos, limites de confianza y posibles vectores de ataque.",
    whenUse: "Cuando estas definiendo arquitectura o revisando riesgos de auth, pagos, admin, uploads o webhooks.",
    activation: "Se activa al pedir threat modeling o analisis de amenazas del sistema.",
    example: "Haz el threat model de este flujo de login y panel admin.",
    limits: "Es de analisis; no es la skill principal para arreglos diarios de codigo.",
  },
  {
    name: "screenshot",
    purpose: "Tomar capturas de pantalla del sistema o de una app para documentar estados visuales.",
    whenUse: "Cuando necesitas evidencia visual de un bug, un layout o una pantalla concreta.",
    activation: "Se activa al pedir capturas del sistema o de una ventana concreta.",
    example: "Saca una captura del login admin para comparar antes y despues.",
    limits: "No hace automatizacion completa; captura, no prueba flujos.",
  },
  {
    name: "security-best-practices",
    purpose: "Aplicar buenas practicas de seguridad a codigo, auth, validaciones, permisos y manejo de errores.",
    whenUse: "Cuando implementas o revisas modulos sensibles del frontend o backend.",
    activation: "Se activa al pedir revision de seguridad o endurecimiento del codigo.",
    example: "Revisa este endpoint y dime que hay que endurecer por seguridad.",
    limits: "No reemplaza un threat model completo ni una auditoria formal externa.",
  },
  {
    name: "ui-ux-pro-max",
    purpose: "Servir de apoyo para decisiones de estilo, tipografia, paletas, UX y accesibilidad.",
    whenUse: "Cuando quieres mejorar calidad visual y de experiencia sin improvisar decisiones.",
    activation: "Se activa al pedir apoyo de diseno/UX o refinamiento visual de una app.",
    example: "Propone paleta, tipografia y mejoras UX para este dashboard.",
    limits: "Apoya decisiones; no reemplaza por si sola la implementacion frontend.",
  },
  {
    name: "optimizacion-estricta-concisa",
    purpose: "Trabajar con cambios minimos, salida directa, poco ruido y respeto fuerte por la arquitectura.",
    whenUse: "Cuando quieres diffs pequenos y ejecucion quirurgica en un repo existente.",
    activation: "Se activa al pedir trabajo directo, sin relleno, con cambios minimos.",
    example: "Arregla este bug con el menor diff posible.",
    limits: "No define producto ni diseno; condiciona el modo de ejecucion.",
  },
  {
    name: "protocolo-desarrollo-6-fases",
    purpose: "Llevar un proyecto grande con discovery, plan, diseno, ejecucion, revision y refinamiento.",
    whenUse: "Cuando vas a iniciar una app nueva o un cambio estructural grande.",
    activation: "Se activa al pedir un desarrollo completo con proceso formal.",
    example: "Define y ejecuta el desarrollo de una app nueva con fases claras.",
    limits: "Puede ser mas pesado de lo necesario para tareas chicas o fixes rapidos.",
  },
];

const mcps = [
  {
    name: "figma",
    purpose: "Conectar con Figma para leer disenos reales, nodos, variables, assets y contexto visual.",
    activateWhen: "Cuando la tarea necesita leer o implementar desde un archivo real de Figma.",
    needs: "Servidor MCP de Figma encendido, cuenta/autorizacion y archivo accesible.",
    usage: "Pedir lectura de frames, analisis de nodos o implementacion desde un link de Figma.",
    limits: "Sin conexion real no puede inspeccionar el archivo; solo se trabaja con capturas o descripcion.",
  },
  {
    name: "linear",
    purpose: "Conectar con Linear para consultar o usar issues, proyectos y seguimiento del trabajo del equipo.",
    activateWhen: "Cuando la tarea depende de tickets, backlog, estado de trabajo o issue tracking en Linear.",
    needs: "Servidor MCP de Linear conectado y acceso al workspace correcto.",
    usage: "Usarlo para revisar tareas, contexto de issues o relacionar trabajo tecnico con tickets del equipo.",
    limits: "No sirve si el equipo no usa Linear o si no hay acceso al workspace.",
  },
  {
    name: "pencil",
    purpose: "Aportar guias y reglas de diseno estructurado para componentes, layouts y sistemas visuales.",
    activateWhen: "Cuando se trabaja en diseno guiado por reglas o composicion apoyada por el sistema Pencil.",
    needs: "Servidor MCP de Pencil disponible y una tarea de diseno compatible.",
    usage: "Consultar guidelines de layout, design system o tablas antes de implementar interfaces.",
    limits: "No reemplaza Figma ni genera por si solo una app completa; aporta reglas y criterios.",
  },
  {
    name: "playwright",
    purpose: "Automatizar navegador real para navegar, hacer click, revisar red, consola y capturas.",
    activateWhen: "Cuando la tarea requiere probar una web real, depurar interacciones o inspeccionar errores de navegador.",
    needs: "Servidor MCP de Playwright activo y una app o URL accesible.",
    usage: "Abrir una app, capturar snapshot, revisar requests, errores de consola o sacar screenshots.",
    limits: "No es una skill conceptual; es una herramienta de automatizacion real del navegador.",
  },
  {
    name: "supabase",
    purpose: "Conectar con un proyecto Supabase para trabajar con datos, auth, storage o diagnostico tecnico.",
    activateWhen: "Cuando la tarea depende del proyecto Supabase real y no basta con datos locales.",
    needs: "Servidor MCP de Supabase configurado y acceso valido al proyecto o entorno.",
    usage: "Consultar datos, revisar configuracion o apoyar tareas conectadas a base de datos/auth/storage.",
    limits: "Sin acceso correcto al proyecto no puede operar; tampoco reemplaza la logica de tu backend.",
  },
];

const supportFiles = [
  {
    name: "frontend-skill.md",
    purpose: "Archivo fuente o referencia documental de la skill frontend-skill.",
  },
  {
    name: "buenas-practicas-desarrollo.md",
    purpose: "Guia escrita del equipo; no es una skill automatica, sino una referencia de trabajo.",
  },
  {
    name: "LICENSE.txt",
    purpose: "Archivo de licencia o terminos de uso del contenido asociado.",
  },
];

const pageWidth = 12240;
const contentWidth = 9360;
const border = { style: BorderStyle.SINGLE, size: 1, color: "D6D9DE" };
const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

function textRun(text, options = {}) {
  return new TextRun({
    text,
    font: options.font || "Arial",
    size: options.size || 22,
    bold: options.bold || false,
    color: options.color,
    italics: options.italics || false,
    break: options.breaks || 0,
  });
}

function paragraph(text, options = {}) {
  return new Paragraph({
    heading: options.heading,
    alignment: options.alignment,
    spacing: options.spacing || { after: 160 },
    pageBreakBefore: options.pageBreakBefore || false,
    children: Array.isArray(text)
      ? text
      : [textRun(text, { bold: options.bold, size: options.size, color: options.color, italics: options.italics })],
  });
}

function bullet(text) {
  return new Paragraph({
    spacing: { after: 80 },
    numbering: {
      reference: "bullets",
      level: 0,
    },
    children: [textRun(text)],
  });
}

function infoLabel(label, value) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [textRun(`${label}: `, { bold: true }), textRun(value)],
  });
}

function tableCell(content, width, opts = {}) {
  const children = Array.isArray(content) ? content : [paragraph(content, { spacing: { after: 80 } })];
  return new TableCell({
    borders: { top: border, bottom: border, left: border, right: border },
    width: { size: width, type: WidthType.DXA },
    shading: opts.fill ? { fill: opts.fill, type: ShadingType.CLEAR } : undefined,
    margins: cellMargins,
    children,
  });
}

function makeTable(headers, rows, widths) {
  return new Table({
    width: { size: contentWidth, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({
        children: headers.map((header, index) =>
          tableCell(
            [new Paragraph({ spacing: { after: 60 }, children: [textRun(header, { bold: true })] })],
            widths[index],
            { fill: "EAF2FF" },
          ),
        ),
      }),
      ...rows.map((row) =>
        new TableRow({
          children: row.map((cell, index) =>
            tableCell(
              [new Paragraph({ spacing: { after: 60 }, children: [textRun(cell)] })],
              widths[index],
            ),
          ),
        }),
      ),
    ],
  });
}

function buildSkillSections() {
  const blocks = [];
  for (const skill of skills) {
    blocks.push(paragraph(skill.name, { heading: HeadingLevel.HEADING_2, pageBreakBefore: false }));
    blocks.push(infoLabel("Que hace", skill.purpose));
    blocks.push(infoLabel("Cuando usarla", skill.whenUse));
    blocks.push(infoLabel("Como se activa", skill.activation));
    blocks.push(infoLabel("Ejemplo", skill.example));
    blocks.push(infoLabel("Limites", skill.limits));
  }
  return blocks;
}

function buildMcpSections() {
  const blocks = [];
  for (const mcp of mcps) {
    blocks.push(paragraph(mcp.name, { heading: HeadingLevel.HEADING_2 }));
    blocks.push(infoLabel("Para que sirve", mcp.purpose));
    blocks.push(infoLabel("Cuando se activa", mcp.activateWhen));
    blocks.push(infoLabel("Que necesita para funcionar", mcp.needs));
    blocks.push(infoLabel("Como usarlo", mcp.usage));
    blocks.push(infoLabel("Limites", mcp.limits));
  }
  return blocks;
}

const skillRows = skills.map((skill) => [skill.name, skill.purpose, skill.whenUse, skill.activation]);
const mcpRows = mcps.map((mcp) => [mcp.name, mcp.purpose, mcp.activateWhen, mcp.needs]);

const doc = new Document({
  creator: "Codex",
  title: "Guia practica de Skills y MCP",
  description: "Documento interno para explicar skills y MCP al equipo.",
  styles: {
    default: {
      document: {
        run: {
          font: "Arial",
          size: 22,
        },
      },
    },
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 30, bold: true, font: "Arial", color: "1F3A5F" },
        paragraph: { spacing: { before: 240, after: 160 }, outlineLevel: 0 },
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: "274E7A" },
        paragraph: { spacing: { before: 180, after: 120 }, outlineLevel: 1 },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "•",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              spacing: { after: 120 },
              children: [textRun("Guia practica de Skills y MCP", { size: 18, color: "5B6573" })],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                textRun("Pagina ", { size: 18, color: "5B6573" }),
                new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 18, color: "5B6573" }),
              ],
            }),
          ],
        }),
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 1800, after: 220 },
          children: [textRun("Guia practica de Skills y MCP", { bold: true, size: 38, color: "1F3A5F" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 220 },
          children: [textRun("Referencia para explicar al equipo que hace cada skill y cada servidor MCP.", { size: 24 })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 900 },
          children: [textRun(`Generado el ${new Date().toLocaleDateString("es-CR")}`, { size: 22, color: "5B6573" })],
        }),
        paragraph("Este documento resume para que sirve cada herramienta visible en la coleccion actual, cuando conviene usarla, como suele activarse y cuales son sus limites practicos.", {
          alignment: AlignmentType.CENTER,
          spacing: { after: 220 },
        }),
        paragraph([new PageBreak()]),
        paragraph("Tabla de contenido", { heading: HeadingLevel.HEADING_1 }),
        new TableOfContents("Contenido", { hyperlink: true, headingStyleRange: "1-2" }),
        paragraph([new PageBreak()]),
        paragraph("Que es una skill y que es un MCP", { heading: HeadingLevel.HEADING_1 }),
        paragraph("Skill", { heading: HeadingLevel.HEADING_2 }),
        paragraph("Una skill es un paquete de instrucciones especializadas. No es una integracion externa: es una forma guiada de trabajar mejor en un tipo de tarea concreto."),
        bullet("Sirve para enfocar el trabajo: testing, seguridad, diseno, Figma, debugging, etc."),
        bullet("Puede activarse de forma explicita, por ejemplo mencionando $frontend-design."),
        bullet("Tambien puede activarse implicitamente si la tarea coincide claramente con su objetivo."),
        paragraph("MCP", { heading: HeadingLevel.HEADING_2 }),
        paragraph("Un MCP es una conexion a una herramienta o servicio externo. Permite acceder a capacidades reales fuera del prompt, como Figma, Playwright o Supabase."),
        bullet("Una skill da metodo; un MCP da acceso real a una herramienta conectada."),
        bullet("El MCP solo funciona bien si el servidor esta activo y la cuenta o proyecto estan accesibles."),
        bullet("Algunas skills dependen de un MCP para trabajar al cien por ciento, por ejemplo figma-implement-design."),
        paragraph("Como se activan", { heading: HeadingLevel.HEADING_1 }),
        bullet("Skills: por mencion explicita del nombre o porque la tarea coincide con el flujo para el que fueron creadas."),
        bullet("MCP: cuando la tarea requiere usar la herramienta externa y el servidor esta conectado."),
        bullet("No todo lo visible en una carpeta es una skill ejecutable; algunos archivos son solo referencia o documentacion."),
        paragraph("Resumen de skills", { heading: HeadingLevel.HEADING_1 }),
        makeTable(
          ["Skill", "Para que sirve", "Cuando usarla", "Como se activa"],
          skillRows,
          [1700, 2500, 2500, 2660],
        ),
        paragraph("Detalle por skill", { heading: HeadingLevel.HEADING_1, pageBreakBefore: true }),
        ...buildSkillSections(),
        paragraph("Resumen de MCP", { heading: HeadingLevel.HEADING_1, pageBreakBefore: true }),
        makeTable(
          ["MCP", "Funcion principal", "Cuando se activa", "Que necesita"],
          mcpRows,
          [1400, 2800, 2500, 2660],
        ),
        paragraph("Detalle por MCP", { heading: HeadingLevel.HEADING_1, pageBreakBefore: true }),
        ...buildMcpSections(),
        paragraph("Otros archivos visibles", { heading: HeadingLevel.HEADING_1, pageBreakBefore: true }),
        ...supportFiles.flatMap((item) => [
          paragraph(item.name, { heading: HeadingLevel.HEADING_2 }),
          infoLabel("Que es", item.purpose),
        ]),
        paragraph("Recetas rapidas", { heading: HeadingLevel.HEADING_1, pageBreakBefore: true }),
        bullet("Si quieres probar una app web: usa webapp-testing y, si hace falta navegador real, Playwright MCP."),
        bullet("Si quieres implementar desde Figma: usa figma, figma-implement-design y frontend-design."),
        bullet("Si quieres revisar seguridad: usa security-best-practices; si estas definiendo arquitectura, usa tambien security-threat-model."),
        bullet("Si quieres depurar un bug visual dificil: usa playwright-interactive y screenshot."),
        bullet("Si quieres un arreglo pequeno y limpio en un repo: usa optimizacion-estricta-concisa."),
        bullet("Si quieres iniciar un proyecto grande con metodo: usa protocolo-desarrollo-6-fases."),
      ],
    },
  ],
});

fs.mkdirSync(path.dirname(outputPath), { recursive: true });

Packer.toBuffer(doc)
  .then((buffer) => {
    fs.writeFileSync(outputPath, buffer);
    process.stdout.write(`${outputPath}\n`);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
