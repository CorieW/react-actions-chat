import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import type { ChatTheme, TextMessagePart } from '../../../js/types';

function getCodeLanguageFromClassName(
  className: string | undefined
): string | undefined {
  return typeof className === 'string'
    ? /^language-(.+)$/.exec(className)?.[1]
    : undefined;
}

interface MarkdownTextFormatterProps {
  readonly part: TextMessagePart;
  readonly theme: ChatTheme;
}

function getTextContent(children: React.ReactNode): string {
  if (typeof children === 'string' || typeof children === 'number') {
    return String(children);
  }

  if (Array.isArray(children)) {
    return children.map(getTextContent).join('');
  }

  if (React.isValidElement<{ children?: React.ReactNode }>(children)) {
    return getTextContent(children.props.children);
  }

  return '';
}

/**
 * Renders markdown text parts with lightweight built-in styling.
 *
 * @param props The `MarkdownTextFormatterProps` object.
 */
export function MarkdownTextFormatter({
  part,
  theme,
}: MarkdownTextFormatterProps): React.JSX.Element {
  const codeBackgroundColor = `${theme.backgroundColor ?? '#000000'}26`;
  const codeTextColor = theme.textColor ?? 'currentColor';
  const syntaxHighlightingEnabled =
    part.markdownOptions?.syntaxHighlighting === true;
  const wrapCodeBlock = (
    children: React.ReactNode,
    props: React.HTMLAttributes<HTMLPreElement>
  ): React.JSX.Element => {
    return (
      <pre
        {...props}
        className='my-3 overflow-x-auto rounded-lg p-3 text-xs leading-relaxed whitespace-pre-wrap'
        style={{
          backgroundColor: codeBackgroundColor,
          color: codeTextColor,
        }}
      >
        {children}
      </pre>
    );
  };

  return (
    <div className='text-sm leading-relaxed [overflow-wrap:anywhere]'>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ children, node: _node, ...props }) => (
            <a
              {...props}
              className='underline underline-offset-2'
              style={{ color: codeTextColor }}
            >
              {children}
            </a>
          ),
          code: ({ children, className, node: _node, ref: _ref, ...props }) => {
            const language = getCodeLanguageFromClassName(className);
            const isCodeBlock = Boolean(language);

            if (
              isCodeBlock &&
              syntaxHighlightingEnabled &&
              typeof language === 'string'
            ) {
              return (
                <SyntaxHighlighter
                  language={language}
                  style={oneDark}
                  PreTag='pre'
                  wrapLongLines
                  customStyle={{
                    margin: 0,
                    borderRadius: '0.5rem',
                    backgroundColor: `${theme.backgroundColor ?? '#0b1220'}cc`,
                    padding: '0.75rem',
                  }}
                  codeTagProps={{
                    style: {
                      fontSize: '0.75rem',
                      lineHeight: '1.6',
                    },
                  }}
                >
                  {getTextContent(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              );
            }

            if (isCodeBlock) {
              return (
                <code
                  {...props}
                  className={className}
                >
                  {children}
                </code>
              );
            }

            return (
              <code
                {...props}
                className='rounded px-1.5 py-0.5 text-[0.95em]'
                style={{
                  backgroundColor: codeBackgroundColor,
                  color: codeTextColor,
                }}
              >
                {children}
              </code>
            );
          },
          ol: ({ children, node: _node, ...props }) => (
            <ol
              {...props}
              className='my-3 list-decimal pl-5'
            >
              {children}
            </ol>
          ),
          p: ({ children, node: _node, ...props }) => (
            <p
              {...props}
              className='my-0 whitespace-pre-wrap'
            >
              {children}
            </p>
          ),
          pre: ({ children, node, ...props }) => {
            if (!syntaxHighlightingEnabled) {
              return wrapCodeBlock(children, props);
            }

            const codeChild = Array.isArray(node?.children)
              ? (node.children[0] as
                  | { properties?: { className?: string | string[] } }
                  | undefined)
              : undefined;
            const rawClassName = codeChild?.properties?.className;
            const className = Array.isArray(rawClassName)
              ? rawClassName.join(' ')
              : rawClassName;
            const alreadyHighlighted = Boolean(
              getCodeLanguageFromClassName(className)
            );

            return alreadyHighlighted ? (
              <>{children}</>
            ) : (
              wrapCodeBlock(children, props)
            );
          },
          ul: ({ children, node: _node, ...props }) => (
            <ul
              {...props}
              className='my-3 list-disc pl-5'
            >
              {children}
            </ul>
          ),
        }}
      >
        {part.text}
      </ReactMarkdown>
    </div>
  );
}
