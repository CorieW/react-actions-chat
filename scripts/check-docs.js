/**
 * Validates docs reference lists and marked code snippets against the current
 * source types.
 *
 * Steps:
 * 1. Load the workspace TypeScript config and create a source program for the
 *    package code.
 * 2. Compare curated markdown sections and code fences with the exported types
 *    they document.
 * 3. Typecheck selected docs theme support files that do not live in markdown.
 * 4. Extract snippets marked for typechecking into temporary files and compile
 *    them with the same TypeScript options.
 * 5. Print every collected mismatch or diagnostic, or report the checked file
 *    counts when all checks pass.
 */

import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join, relative, resolve } from 'node:path';
import process from 'node:process';
import ts from 'typescript';

const rootDir = resolve(import.meta.dirname, '..');
const docsDir = join(rootDir, 'docs');
const tsConfigPath = join(rootDir, 'config', 'tsconfig.json');
const docsSupportFiles = [
  'docs/.vitepress/config.ts',
  'docs/.vitepress/theme/index.ts',
  'docs-chat/frontend/homepageChatDemo.ts',
];
const printer = ts.createPrinter({
  newLine: ts.NewLineKind.LineFeed,
});

const { options: tsOptions, fileNames: sourceRootNames } =
  loadTypeScriptConfig(tsConfigPath);
const sourceProgram = ts.createProgram({
  rootNames: sourceRootNames,
  options: tsOptions,
});
const checker = sourceProgram.getTypeChecker();

const referenceValidationErrors = runReferenceChecks();
const sidebarLinkErrors = runSidebarLinkChecks();
const supportFileDiagnostics = runDocsSupportFileTypecheck();
const snippetDiagnostics = runSnippetTypecheck();

const allErrors = [
  ...referenceValidationErrors,
  ...sidebarLinkErrors,
  ...supportFileDiagnostics,
  ...snippetDiagnostics,
];

if (allErrors.length > 0) {
  console.error('Docs checks failed:\n');

  for (const error of allErrors) {
    console.error(`- ${error}`);
  }

  process.exit(1);
}

const snippetCount = collectTypecheckedSnippets().length;
console.log(
  `Docs checks passed (${docsSupportFiles.length} support file${docsSupportFiles.length === 1 ? '' : 's'} and ${snippetCount} snippet${snippetCount === 1 ? '' : 's'} typechecked).`
);

function runReferenceChecks() {
  const checks = [
    createExactPropertyCheck({
      markdownFile: 'docs/reference/core-api.md',
      heading: '`Chat`',
      label: 'Core API `Chat` props',
      sourceFile: 'src/js/types.ts',
      typeName: 'ChatPropsWithFlexibleTheme',
      startMarker: 'Props:',
    }),
    createExactPropertyCheck({
      markdownFile: 'docs/reference/core-api.md',
      heading: '`InputMessage`',
      label: 'Core API `InputMessage` fields',
      sourceFile: 'src/js/types.ts',
      typeName: 'InputMessage',
      startMarker: 'Key fields:',
    }),
    createExactPropertyCheck({
      markdownFile: 'docs/reference/core-api.md',
      heading: '`InputBarModeConfig`',
      label: 'Core API `InputBarModeConfig` fields',
      sourceFile: 'src/js/types.ts',
      typeName: 'InputBarModeConfig',
      startMarker: 'Public mode settings for the shared input bar:',
    }),
    createExactPropertyCheck({
      markdownFile: 'docs/reference/core-api.md',
      heading: '`InputBarValidationConfig`',
      label: 'Core API `InputBarValidationConfig` fields',
      sourceFile: 'src/js/types.ts',
      typeName: 'InputBarValidationConfig',
      startMarker: 'Public validation settings for the shared input bar:',
    }),
    createExactPropertyCheck({
      markdownFile: 'docs/reference/core-api.md',
      heading: '`InputBarBehaviorConfig`',
      label: 'Core API `InputBarBehaviorConfig` fields',
      sourceFile: 'src/js/types.ts',
      typeName: 'InputBarBehaviorConfig',
      startMarker: 'Public behavior settings for the shared input bar:',
    }),
    createExactPropertyCheck({
      markdownFile: 'docs/types/chat-theme.md',
      heading: 'Fields',
      label: '`ChatTheme` fields',
      sourceFile: 'src/js/types.ts',
      typeName: 'ChatTheme',
    }),
    createExactPropertyCheck({
      markdownFile: 'docs/types/input-message.md',
      heading: 'Fields',
      label: '`InputMessage` fields page',
      sourceFile: 'src/js/types.ts',
      typeName: 'InputMessage',
    }),
    createExactPropertyCheck({
      markdownFile: 'docs/types/message-button.md',
      heading: 'Fields',
      label: '`MessageButton` fields',
      sourceFile: 'src/js/types.ts',
      typeName: 'MessageButton',
    }),
    createExactValueCheck({
      markdownFile: 'docs/types/message-button.md',
      heading: 'Variants',
      label: '`MessageButtonVariant` values',
      sourceFile: 'src/js/types.ts',
      typeName: 'MessageButtonVariant',
    }),
    createExactValueCheck({
      markdownFile: 'docs/types/input-type.md',
      heading: 'Supported Values',
      label: '`InputType` values',
      sourceFile: 'src/lib/inputFieldStore.ts',
      typeName: 'InputType',
    }),
    createExactCodeFenceCheck({
      markdownFile: 'docs/types/input-validator.md',
      heading: 'Shape',
      label: '`InputValidator` shape',
      sourceFile: 'src/lib/inputFieldStore.ts',
      typeName: 'InputValidator',
    }),
    createSubsetPropertyCheck({
      markdownFile: 'docs/components/input-request-buttons.md',
      heading: 'Common Options',
      label: 'Input-request definition options',
      sourceFile: 'src/components/RequestInputButton/types.ts',
      typeName: 'RequestInputButtonDefinition',
      startMarker: 'Important definition fields:',
      endMarker: 'Important runtime fields:',
    }),
    createSubsetPropertyCheck({
      markdownFile: 'docs/components/input-request-buttons.md',
      heading: 'Common Options',
      label: 'Input-request runtime options',
      sourceFile: 'src/components/RequestInputButton/types.ts',
      typeName: 'RequestInputButtonRuntimeConfig',
      startMarker: 'Important runtime fields:',
    }),
    createSubsetPropertyCheck({
      markdownFile: 'docs/components/confirmation-buttons.md',
      heading: 'Common Options',
      label: 'Confirmation definition options',
      sourceFile: 'src/components/RequestConfirmationButton.tsx',
      typeName: 'RequestConfirmationButtonDefinition',
      startMarker: 'Important definition fields:',
      endMarker: 'Important runtime fields:',
    }),
    createSubsetPropertyCheck({
      markdownFile: 'docs/components/confirmation-buttons.md',
      heading: 'Common Options',
      label: 'Confirmation runtime options',
      sourceFile: 'src/components/RequestConfirmationButton.tsx',
      typeName: 'RequestConfirmationButtonRuntimeConfig',
      startMarker: 'Important runtime fields:',
    }),
    createSubsetPropertyCheck({
      markdownFile: 'docs/stores/use-chat-store.md',
      heading: 'Common Reads',
      label: '`useChatStore` read methods',
      sourceFile: 'src/lib/chatStore.ts',
      typeName: 'ChatState',
      startMarker: 'Useful methods:',
    }),
    createSubsetPropertyCheck({
      markdownFile: 'docs/stores/use-chat-store.md',
      heading: 'Common Writes',
      label: '`useChatStore` write methods',
      sourceFile: 'src/lib/chatStore.ts',
      typeName: 'ChatState',
      startMarker: 'Useful methods:',
    }),
    createSubsetPropertyCheck({
      markdownFile: 'docs/stores/use-chat-store.md',
      heading: 'Loading State',
      label: '`useChatStore` loading methods',
      sourceFile: 'src/lib/chatStore.ts',
      typeName: 'ChatState',
      startMarker: 'Useful methods:',
    }),
    createSubsetPropertyCheck({
      markdownFile: 'docs/stores/use-input-field-store.md',
      heading: 'Common Reads',
      label: '`useInputFieldStore` getters',
      sourceFile: 'src/lib/inputFieldStore.ts',
      typeName: 'InputFieldState',
      startMarker: 'Useful getters:',
    }),
    createSubsetPropertyCheck({
      markdownFile: 'docs/stores/use-input-field-store.md',
      heading: 'Common Writes',
      label: '`useInputFieldStore` setters',
      sourceFile: 'src/lib/inputFieldStore.ts',
      typeName: 'InputFieldState',
      startMarker: 'Useful setters:',
      endMarker: 'Reset helpers:',
    }),
    createSubsetPropertyCheck({
      markdownFile: 'docs/stores/use-input-field-store.md',
      heading: 'Common Writes',
      label: '`useInputFieldStore` reset helpers',
      sourceFile: 'src/lib/inputFieldStore.ts',
      typeName: 'InputFieldState',
      startMarker: 'Reset helpers:',
    }),
    createSubsetPropertyCheck({
      markdownFile: 'docs/stores/use-persistent-button-store.md',
      heading: 'Common Reads',
      label: '`usePersistentButtonStore` read methods',
      sourceFile: 'src/lib/persistentButtonStore.ts',
      typeName: 'PersistentButtonStoreState',
      startMarker: 'Useful method:',
    }),
    createSubsetPropertyCheck({
      markdownFile: 'docs/stores/use-persistent-button-store.md',
      heading: 'Common Writes',
      label: '`usePersistentButtonStore` write methods',
      sourceFile: 'src/lib/persistentButtonStore.ts',
      typeName: 'PersistentButtonStoreState',
      startMarker: 'Useful methods:',
    }),
    createExactPropertyCheck({
      markdownFile: 'docs/reference/recommended-actions-api.md',
      heading: '`createQueryRecommendedActionsFlow(config)`',
      label: 'Recommended actions returned API',
      sourceFile:
        'packages/react-actions-chat-recommended-actions/src/queryRecommendedActionsFlow.ts',
      typeName: 'QueryRecommendedActionsFlow',
      startMarker: 'Returned API:',
      endMarker: 'Important config fields:',
    }),
    createSubsetPropertyCheck({
      markdownFile: 'docs/reference/recommended-actions-api.md',
      heading: '`createQueryRecommendedActionsFlow(config)`',
      label: 'Recommended actions query config fields',
      sourceFile:
        'packages/react-actions-chat-recommended-actions/src/queryRecommendedActionsFlow.ts',
      typeName: 'QueryRecommendedActionsFlowConfig',
      startMarker: 'Important config fields:',
    }),
    createSubsetPropertyCheck({
      markdownFile: 'docs/reference/recommended-actions-api.md',
      heading: '`createVectorSearchQueryRecommendedActionsFlow(config)`',
      label: 'Recommended actions vector-search config fields',
      sourceFile:
        'packages/react-actions-chat-recommended-actions/src/vectorSearchQueryRecommendedActionsFlow.ts',
      typeName: 'VectorSearchQueryRecommendedActionsFlowConfig',
      startMarker: 'Important config fields:',
    }),
    createExactPropertyCheck({
      markdownFile: 'docs/reference/recommended-actions-api.md',
      heading: '`QueryRecommendedActionsContext`',
      label: '`QueryRecommendedActionsContext` fields',
      sourceFile:
        'packages/react-actions-chat-recommended-actions/src/queryRecommendedActionsFlow.ts',
      typeName: 'QueryRecommendedActionsContext',
      startMarker: 'Resolver context with:',
    }),
    createExactPropertyCheck({
      markdownFile: 'docs/reference/recommended-actions-api.md',
      heading: '`VectorSearchButtonMatch`',
      label: '`VectorSearchButtonMatch` fields',
      sourceFile:
        'packages/react-actions-chat-recommended-actions/src/vectorSearchQueryRecommendedActionsFlow.ts',
      typeName: 'VectorSearchButtonMatch',
      startMarker: 'Scored result shape:',
    }),
  ];

  const errors = [];

  for (const check of checks) {
    const actualItems = getDocumentedItems(check);
    const expectedItems = getExpectedItems(check);

    if (check.mode === 'exact') {
      const missing = expectedItems.filter(item => !actualItems.includes(item));
      const extra = actualItems.filter(item => !expectedItems.includes(item));

      if (missing.length > 0 || extra.length > 0) {
        errors.push(
          `${check.label} in ${check.markdownFile} is out of sync. Missing: ${formatItems(
            missing
          )}. Extra: ${formatItems(extra)}.`
        );
      }

      continue;
    }

    const invalid = actualItems.filter(item => !expectedItems.includes(item));

    if (invalid.length > 0) {
      errors.push(
        `${check.label} in ${check.markdownFile} documents unknown items: ${formatItems(
          invalid
        )}.`
      );
    }
  }

  return errors;
}

function runSnippetTypecheck() {
  const snippets = collectTypecheckedSnippets();

  if (snippets.length === 0) {
    return [];
  }

  const tempDir = mkdtempSync(join(rootDir, '.docs-check-'));
  const tempFileToSnippet = new Map();

  try {
    const ambientTypesPath = createDocsAmbientTypesFile(tempDir);

    const rootNames = [ambientTypesPath];

    for (const snippet of snippets) {
      const tempFilePath = join(
        tempDir,
        `${snippet.fileStem}.${snippet.language === 'ts' ? 'ts' : 'tsx'}`
      );

      writeFileSync(tempFilePath, snippet.code);
      tempFileToSnippet.set(tempFilePath, snippet);
      rootNames.push(tempFilePath);
    }

    const snippetProgram = ts.createProgram({
      rootNames,
      options: {
        ...tsOptions,
        noUnusedLocals: false,
        noUnusedParameters: false,
      },
    });

    const diagnostics = ts
      .getPreEmitDiagnostics(snippetProgram)
      .filter(diagnostic => {
        return (
          diagnostic.file &&
          tempFileToSnippet.has(resolve(diagnostic.file.fileName))
        );
      });

    return diagnostics.map(diagnostic => {
      const filePath = diagnostic.file
        ? resolve(diagnostic.file.fileName)
        : undefined;
      const snippet = filePath ? tempFileToSnippet.get(filePath) : undefined;
      const message = ts.flattenDiagnosticMessageText(
        diagnostic.messageText,
        '\n'
      );

      if (!diagnostic.file || !snippet || diagnostic.start === undefined) {
        return `Snippet typecheck failed: ${message}`;
      }

      const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(
        diagnostic.start
      );
      const docLine = snippet.codeStartLine + line;

      return `${snippet.markdownFile}:${docLine}:${character + 1} ${message}`;
    });
  } finally {
    rmSync(tempDir, {
      force: true,
      recursive: true,
    });
  }
}

function runDocsSupportFileTypecheck() {
  const tempDir = mkdtempSync(join(rootDir, '.docs-check-'));
  const absoluteSupportFiles = docsSupportFiles.map(file =>
    resolve(rootDir, file)
  );
  const supportFileSet = new Set(absoluteSupportFiles);

  try {
    const ambientTypesPath = createDocsAmbientTypesFile(tempDir);
    const supportProgram = ts.createProgram({
      rootNames: [ambientTypesPath, ...absoluteSupportFiles],
      options: {
        ...tsOptions,
        noUnusedLocals: false,
        noUnusedParameters: false,
      },
    });

    const diagnostics = ts
      .getPreEmitDiagnostics(supportProgram)
      .filter(diagnostic => {
        return (
          diagnostic.file &&
          supportFileSet.has(resolve(diagnostic.file.fileName))
        );
      });

    return diagnostics.map(diagnostic => formatDiagnostic(diagnostic));
  } finally {
    rmSync(tempDir, {
      force: true,
      recursive: true,
    });
  }
}

function runSidebarLinkChecks() {
  const configPath = join(rootDir, 'docs/.vitepress/config.ts');
  const configContent = readFileSync(configPath, 'utf8');
  const sourceFileNode = ts.createSourceFile(
    configPath,
    configContent,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );
  const errors = [];

  function visit(node) {
    if (
      ts.isPropertyAssignment(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'link' &&
      ts.isStringLiteralLike(node.initializer) &&
      /^\/.+\/index$/.test(node.initializer.text)
    ) {
      const { line, character } = sourceFileNode.getLineAndCharacterOfPosition(
        node.initializer.getStart(sourceFileNode)
      );
      errors.push(
        `${relative(rootDir, configPath)}:${line + 1}:${character + 1} uses "${node.initializer.text}". Link index pages as directory routes, for example "/components/", so VitePress pager lookup can match index.md pages.`
      );
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFileNode);

  return errors;
}

function collectTypecheckedSnippets() {
  const markdownFiles = listMarkdownFiles(docsDir);
  const snippets = [];

  for (const absolutePath of markdownFiles) {
    const markdownFile = relative(rootDir, absolutePath);
    const content = readFileSync(absolutePath, 'utf8');
    const codeFencePattern = /```([^\n]*)\n([\s\S]*?)```/g;
    let match;
    let snippetIndex = 0;

    while ((match = codeFencePattern.exec(content)) !== null) {
      const info = match[1]?.trim() ?? '';
      const tokens = info.split(/\s+/).filter(Boolean);
      const language = tokens[0];
      const shouldTypecheck = tokens.includes('typecheck');

      if (!shouldTypecheck || (language !== 'ts' && language !== 'tsx')) {
        continue;
      }

      snippetIndex += 1;
      snippets.push({
        code: match[2],
        codeStartLine: countLines(content.slice(0, match.index)) + 2,
        fileStem: sanitizeFileName(`${markdownFile}-${snippetIndex}`),
        language,
        markdownFile,
      });
    }
  }

  return snippets;
}

function listMarkdownFiles(directory) {
  const entries = readdirSync(directory, {
    withFileTypes: true,
  });
  const files = [];

  for (const entry of entries) {
    if (
      entry.name === '.vitepress' ||
      entry.name === 'AGENTS.md' ||
      entry.name === '.gitignore'
    ) {
      continue;
    }

    const absolutePath = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...listMarkdownFiles(absolutePath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(absolutePath);
    }
  }

  return files;
}

function getDocumentedItems(check) {
  if (check.kind === 'code') {
    return [getCodeFenceContent(check.markdownFile, check.heading)];
  }

  return getBulletItems({
    markdownFile: check.markdownFile,
    heading: check.heading,
    startMarker: check.startMarker,
    endMarker: check.endMarker,
  }).map(item => {
    if (check.kind === 'values') {
      return item;
    }

    return normalizePropertyName(item);
  });
}

function getExpectedItems(check) {
  if (check.kind === 'code') {
    return [getTypeAliasDeclaration(check.sourceFile, check.typeName)];
  }

  if (check.kind === 'values') {
    return getTypeValues(check.sourceFile, check.typeName);
  }

  return getTypeProperties(check.sourceFile, check.typeName);
}

function getBulletItems({ markdownFile, heading, startMarker, endMarker }) {
  const sectionContent = getHeadingSection(markdownFile, heading);
  const rangeContent = getSectionRange({
    content: sectionContent,
    endMarker,
    heading,
    markdownFile,
    startMarker,
  });

  return [...rangeContent.matchAll(/^- `([^`]+)`/gm)].map(match => match[1]);
}

function getCodeFenceContent(markdownFile, heading) {
  const sectionContent = getHeadingSection(markdownFile, heading);
  const match = sectionContent.match(/```[^\n]*\n([\s\S]*?)```/);

  if (!match?.[1]) {
    throw new Error(
      `No code fence found in ${markdownFile} under "${heading}".`
    );
  }

  return normalizeCode(match[1]);
}

function getHeadingSection(markdownFile, heading) {
  const absolutePath = join(rootDir, markdownFile);
  const content = readFileSync(absolutePath, 'utf8');
  const headingMatches = [...content.matchAll(/^(#{1,6}) (.+)$/gm)].map(
    match => ({
      index: match.index,
      level: match[1].length,
      title: match[2],
    })
  );
  const targetIndex = headingMatches.findIndex(
    match => match.title === heading
  );

  if (targetIndex === -1) {
    throw new Error(`Heading "${heading}" not found in ${markdownFile}.`);
  }

  const targetHeading = headingMatches[targetIndex];
  const nextHeading = headingMatches
    .slice(targetIndex + 1)
    .find(match => match.level <= targetHeading.level);

  const start = targetHeading.index;
  const end = nextHeading?.index ?? content.length;

  return content.slice(start, end);
}

function getSectionRange({
  content,
  markdownFile,
  heading,
  startMarker,
  endMarker,
}) {
  let range = content;

  if (startMarker) {
    const startIndex = range.indexOf(startMarker);

    if (startIndex === -1) {
      throw new Error(
        `Marker "${startMarker}" not found in ${markdownFile} under "${heading}".`
      );
    }

    range = range.slice(startIndex + startMarker.length);
  }

  if (endMarker) {
    const endIndex = range.indexOf(endMarker);

    if (endIndex === -1) {
      throw new Error(
        `Marker "${endMarker}" not found in ${markdownFile} under "${heading}".`
      );
    }

    range = range.slice(0, endIndex);
  }

  return range;
}

function getTypeProperties(sourceFile, typeName) {
  const { declaration } = getTypeDeclaration(sourceFile, typeName);
  const type = checker.getTypeAtLocation(declaration);
  return getAllPropertyNames(type);
}

function getAllPropertyNames(type) {
  if (type.isUnion()) {
    return sortUnique(
      type.types.flatMap(unionMember => getAllPropertyNames(unionMember))
    );
  }

  return sortUnique(
    checker.getPropertiesOfType(type).map(property => property.getName())
  );
}

function getTypeValues(sourceFile, typeName) {
  const { declaration } = getTypeDeclaration(sourceFile, typeName);
  const type = checker.getTypeAtLocation(declaration);

  if (!type.isUnion()) {
    throw new Error(`${typeName} in ${sourceFile} is not a union type.`);
  }

  return sortUnique(
    type.types.map(unionMember => {
      if (unionMember.isStringLiteral()) {
        return unionMember.value;
      }

      return checker.typeToString(unionMember);
    })
  );
}

function getTypeAliasDeclaration(sourceFile, typeName) {
  const { declaration, sourceFileNode } = getTypeDeclaration(
    sourceFile,
    typeName
  );

  if (!ts.isTypeAliasDeclaration(declaration)) {
    throw new Error(`${typeName} in ${sourceFile} is not a type alias.`);
  }

  return normalizeCode(
    `type ${typeName} = ${printer.printNode(
      ts.EmitHint.Unspecified,
      declaration.type,
      sourceFileNode
    )};`
  );
}

function getTypeDeclaration(sourceFile, typeName) {
  const absolutePath = join(rootDir, sourceFile);
  const sourceFileNode = sourceProgram.getSourceFile(absolutePath);

  if (!sourceFileNode) {
    throw new Error(`Could not load source file ${sourceFile}.`);
  }

  let declaration;

  ts.forEachChild(sourceFileNode, node => {
    if (
      (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) &&
      node.name.text === typeName
    ) {
      declaration = node;
    }
  });

  if (!declaration) {
    throw new Error(`Could not find ${typeName} in ${sourceFile}.`);
  }

  return {
    declaration,
    sourceFileNode,
  };
}

function loadTypeScriptConfig(configPath) {
  const readResult = ts.readConfigFile(configPath, ts.sys.readFile);

  if (readResult.error) {
    throw new Error(
      ts.flattenDiagnosticMessageText(readResult.error.messageText, '\n')
    );
  }

  const parsed = ts.parseJsonConfigFileContent(
    readResult.config,
    ts.sys,
    resolve(configPath, '..')
  );

  if (parsed.errors.length > 0) {
    throw new Error(
      parsed.errors
        .map(error => ts.flattenDiagnosticMessageText(error.messageText, '\n'))
        .join('\n')
    );
  }

  return parsed;
}

function createDocsAmbientTypesFile(tempDir) {
  const ambientTypesPath = join(tempDir, 'docs-check-env.d.ts');

  writeFileSync(
    ambientTypesPath,
    [
      "declare module '*.css';",
      "declare module '*.css?inline' {",
      '  const content: string;',
      '  export default content;',
      '}',
      "declare module '*.vue' {",
      "  import type { DefineComponent } from 'vue';",
      '  const component: DefineComponent<Record<string, never>, Record<string, never>, any>;',
      '  export default component;',
      '}',
      "declare module 'react-actions-chat/styles';",
      'declare const process: {',
      '  readonly env: Record<string, string | undefined>;',
      '};',
      'interface ImportMetaEnv {',
      '  readonly VITE_OPENAI_API_KEY?: string;',
      '  readonly [key: string]: string | undefined;',
      '}',
      'interface ImportMeta {',
      '  readonly env: ImportMetaEnv;',
      '}',
    ].join('\n')
  );

  return ambientTypesPath;
}

function createExactPropertyCheck(config) {
  return {
    ...config,
    kind: 'properties',
    mode: 'exact',
  };
}

function createSubsetPropertyCheck(config) {
  return {
    ...config,
    kind: 'properties',
    mode: 'subset',
  };
}

function createExactValueCheck(config) {
  return {
    ...config,
    kind: 'values',
    mode: 'exact',
  };
}

function createExactCodeFenceCheck(config) {
  return {
    ...config,
    kind: 'code',
    mode: 'exact',
  };
}

function normalizePropertyName(value) {
  const match = value.match(/^([A-Za-z_$][\w$]*)/);

  if (!match?.[1]) {
    throw new Error(`Could not parse property name from "${value}".`);
  }

  return match[1];
}

function normalizeCode(value) {
  return value.replace(/\s+/g, '');
}

function formatItems(items) {
  return items.length > 0 ? items.join(', ') : 'none';
}

function formatDiagnostic(diagnostic) {
  const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');

  if (!diagnostic.file || diagnostic.start === undefined) {
    return `Docs typecheck failed: ${message}`;
  }

  const filePath = resolve(diagnostic.file.fileName);
  const relativeFilePath = relative(rootDir, filePath);
  const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(
    diagnostic.start
  );

  return `${relativeFilePath}:${line + 1}:${character + 1} ${message}`;
}

function sortUnique(values) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function sanitizeFileName(value) {
  return value.replace(/[^a-zA-Z0-9_-]+/g, '-');
}

function countLines(value) {
  return value === '' ? 0 : value.split('\n').length;
}
