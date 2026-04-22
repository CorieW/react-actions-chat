/**
 * Generates a retrieval corpus for the docs homepage assistant from markdown.
 *
 * Steps:
 * 1. Walk the `docs/` tree while skipping VitePress internals and repo metadata.
 * 2. Strip frontmatter, derive page titles/routes, and split each page into
 *    heading-aware sections.
 * 3. Normalize markdown into plain-text chunks with stable route references.
 * 4. Write the generated corpus JSON into the docs assistant backend tree.
 */

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, extname, join, resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '..');
const docsRoot = join(repoRoot, 'docs');
const outputDirectory = join(repoRoot, 'docs-chat', 'backend', 'generated');
const outputFile = join(outputDirectory, 'docsAssistantCorpus.json');
const MAX_CHUNK_LENGTH = 1400;

const markdownFiles = collectMarkdownFiles(docsRoot).sort((left, right) =>
  left.localeCompare(right)
);
const chunks = markdownFiles.flatMap(filePath => buildChunksForFile(filePath));

mkdirSync(outputDirectory, {
  recursive: true,
});
writeFileSync(
  outputFile,
  JSON.stringify(
    {
      chunkCount: chunks.length,
      chunks,
    },
    null,
    2
  )
);

console.log(
  `Generated docs assistant corpus with ${chunks.length} chunk(s) from ${markdownFiles.length} markdown file(s).`
);

function collectMarkdownFiles(directoryPath) {
  const entries = readdirSync(directoryPath, {
    withFileTypes: true,
  });
  const files = [];

  for (const entry of entries) {
    if (entry.name === '.vitepress') {
      continue;
    }

    const entryPath = join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectMarkdownFiles(entryPath));
      continue;
    }

    if (extname(entry.name) !== '.md' || entry.name === 'AGENTS.md') {
      continue;
    }

    files.push(entryPath);
  }

  return files;
}

function buildChunksForFile(filePath) {
  const rawMarkdown = readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
  const relativeFilePath = toPosixPath(filePath.slice(docsRoot.length + 1));
  const { body, frontmatter } = stripFrontmatter(rawMarkdown);
  const pageTitle = resolvePageTitle(frontmatter, body, relativeFilePath);
  const route = resolveRoute(relativeFilePath);
  const lines = body.split('\n');
  const sections = [];
  const headingStack = [];
  let currentAnchor = '';
  let currentSectionLines = [];

  const flushSection = () => {
    const sectionMarkdown = currentSectionLines.join('\n').trim();

    if (sectionMarkdown === '') {
      currentSectionLines = [];
      return;
    }

    sections.push(
      ...createSectionChunks({
        anchor: currentAnchor,
        headingPath: [...headingStack],
        pageTitle,
        relativeFilePath,
        route,
        sectionMarkdown,
      })
    );
    currentSectionLines = [];
  };

  for (const line of lines) {
    const headingMatch = /^(#{1,6})\s+(.+)$/.exec(line);

    if (!headingMatch) {
      currentSectionLines.push(line);
      continue;
    }

    flushSection();

    const level = headingMatch[1].length;
    const headingText = normalizeInlineMarkdown(headingMatch[2]);

    headingStack.splice(level - 1);
    headingStack[level - 1] = headingText;
    currentAnchor =
      level === 1 && headingText === pageTitle ? '' : slugify(headingText);
  }

  flushSection();

  return sections;
}

function createSectionChunks({
  anchor,
  headingPath,
  pageTitle,
  relativeFilePath,
  route,
  sectionMarkdown,
}) {
  const paragraphs = splitMarkdownIntoParagraphs(sectionMarkdown)
    .map(paragraph => normalizeMarkdownToText(paragraph))
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return [];
  }

  const referenceLabel = buildReferenceLabel(pageTitle, headingPath);
  const resolvedRoute = anchor ? `${route}#${anchor}` : route;
  const chunkTexts = combineParagraphs(paragraphs, MAX_CHUNK_LENGTH);
  const normalizedHeadingPath = headingPath.filter(Boolean);

  return chunkTexts.map((chunkText, index) => ({
    filePath: relativeFilePath,
    headingPath: normalizedHeadingPath,
    id: [
      relativeFilePath.replace(/\.md$/, '').replace(/[^a-z0-9/]+/gi, '-'),
      anchor || 'page',
      String(index + 1),
    ].join(':'),
    referenceLabel,
    route: resolvedRoute,
    searchText: `Page: ${pageTitle}\nSection: ${referenceLabel}\nContent: ${chunkText}`,
    text: chunkText,
    title: pageTitle,
  }));
}

function combineParagraphs(paragraphs, maxChunkLength) {
  const chunks = [];
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    if (paragraph.length > maxChunkLength) {
      if (currentChunk !== '') {
        chunks.push(currentChunk);
        currentChunk = '';
      }

      chunks.push(...splitLongText(paragraph, maxChunkLength));
      continue;
    }

    const nextChunk =
      currentChunk === '' ? paragraph : `${currentChunk}\n\n${paragraph}`;

    if (nextChunk.length > maxChunkLength && currentChunk !== '') {
      chunks.push(currentChunk);
      currentChunk = paragraph;
      continue;
    }

    currentChunk = nextChunk;
  }

  if (currentChunk !== '') {
    chunks.push(currentChunk);
  }

  return chunks;
}

function splitMarkdownIntoParagraphs(markdown) {
  const paragraphs = [];
  const lines = markdown.split('\n');
  let currentParagraphLines = [];
  let isInsideCodeBlock = false;

  const flushParagraph = () => {
    const paragraph = currentParagraphLines.join('\n').trim();

    if (paragraph) {
      paragraphs.push(paragraph);
    }

    currentParagraphLines = [];
  };

  for (const line of lines) {
    const trimmedLine = line.trim();
    const isCodeFence = trimmedLine.startsWith('```');

    if (!isInsideCodeBlock && trimmedLine === '') {
      flushParagraph();
      continue;
    }

    currentParagraphLines.push(line);

    if (isCodeFence) {
      isInsideCodeBlock = !isInsideCodeBlock;
    }
  }

  flushParagraph();

  return paragraphs;
}

function splitLongText(text, maxChunkLength) {
  const chunks = [];
  let remainingText = text.trim();

  while (remainingText.length > maxChunkLength) {
    const slice = remainingText.slice(0, maxChunkLength);
    const splitIndex = slice.lastIndexOf(' ');
    const resolvedSplitIndex =
      splitIndex > Math.floor(maxChunkLength * 0.6)
        ? splitIndex
        : maxChunkLength;

    chunks.push(remainingText.slice(0, resolvedSplitIndex).trim());
    remainingText = remainingText.slice(resolvedSplitIndex).trim();
  }

  if (remainingText !== '') {
    chunks.push(remainingText);
  }

  return chunks;
}

function stripFrontmatter(markdown) {
  if (!markdown.startsWith('---\n')) {
    return {
      body: markdown,
      frontmatter: '',
    };
  }

  const closingDelimiterIndex = markdown.indexOf('\n---\n', 4);

  if (closingDelimiterIndex === -1) {
    return {
      body: markdown,
      frontmatter: '',
    };
  }

  return {
    body: markdown.slice(closingDelimiterIndex + 5),
    frontmatter: markdown.slice(4, closingDelimiterIndex),
  };
}

function resolvePageTitle(frontmatter, markdownBody, relativeFilePath) {
  const frontmatterTitleMatch = /^title:\s*(.+)$/m.exec(frontmatter);

  if (frontmatterTitleMatch?.[1]) {
    return normalizeInlineMarkdown(frontmatterTitleMatch[1].trim());
  }

  const headingMatch = /^#\s+(.+)$/m.exec(markdownBody);

  if (headingMatch?.[1]) {
    return normalizeInlineMarkdown(headingMatch[1].trim());
  }

  const fileStem = basename(relativeFilePath, '.md');

  if (fileStem === 'index' && relativeFilePath.endsWith('/index.md')) {
    const directoryName = basename(
      relativeFilePath.slice(0, -'/index.md'.length)
    );
    return toTitleCase(directoryName);
  }

  return toTitleCase(fileStem);
}

function resolveRoute(relativeFilePath) {
  const withoutExtension = relativeFilePath.replace(/\.md$/, '');

  if (withoutExtension === 'index') {
    return '/';
  }

  if (withoutExtension.endsWith('/index')) {
    return `/${withoutExtension.slice(0, -'/index'.length)}`;
  }

  return `/${withoutExtension}`;
}

function buildReferenceLabel(pageTitle, headingPath) {
  const resolvedHeadingPath = headingPath.filter(Boolean);
  const normalizedHeadingPath =
    resolvedHeadingPath[0] === pageTitle
      ? resolvedHeadingPath.slice(1)
      : resolvedHeadingPath;

  if (normalizedHeadingPath.length === 0) {
    return pageTitle;
  }

  return `${pageTitle} -> ${normalizedHeadingPath.join(' -> ')}`;
}

function normalizeMarkdownToText(markdown) {
  const codeBlocks = [];
  const normalizedMarkdown = markdown
    .replace(/```([^\n`]*)\n([\s\S]*?)```/g, (_match, rawInfo, rawCode) => {
      const placeholder = `@@DOCS_ASSISTANT_CODE_BLOCK_${codeBlocks.length}@@`;
      const normalizedLanguage = normalizeCodeFenceLanguage(rawInfo);
      const normalizedCodeBlock = normalizedLanguage
        ? `\`\`\`${normalizedLanguage}\n${rawCode.trimEnd()}\n\`\`\``
        : `\`\`\`\n${rawCode.trimEnd()}\n\`\`\``;

      codeBlocks.push({
        placeholder,
        value: normalizedCodeBlock,
      });

      return `\n${placeholder}\n`;
    })
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*]\([^)]+\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^>\s?/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\|/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/ *\n */g, '\n')
    .trim();

  return codeBlocks
    .reduce(
      (text, codeBlock) => text.replace(codeBlock.placeholder, codeBlock.value),
      normalizedMarkdown
    )
    .trim();
}

function normalizeCodeFenceLanguage(rawInfo) {
  const language = rawInfo.trim().split(/\s+/)[0]?.toLowerCase() ?? '';

  switch (language) {
    case 'typescript':
      return 'ts';
    case 'typescriptreact':
      return 'tsx';
    default:
      return language;
  }
}

function normalizeInlineMarkdown(value) {
  return value
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(value) {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[`'"’]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .trim()
    .replace(/\s+/g, '-');
}

function toTitleCase(value) {
  return value
    .split(/[-/]/)
    .filter(Boolean)
    .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function toPosixPath(value) {
  return value.replace(/\\/g, '/');
}
