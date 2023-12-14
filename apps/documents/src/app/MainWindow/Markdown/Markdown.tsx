// import "katex/dist/katex.min.css";
import { FunctionComponent, useMemo } from 'react';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { darcula as highlighterStyle } from 'react-syntax-highlighter/dist/esm/styles/prism';
// import rehypeKatexPlugin from 'rehype-katex';
import 'github-markdown-css/github-markdown-light.css';
import { SpecialComponents } from 'react-markdown/lib/ast-to-react';
import { NormalComponents } from 'react-markdown/lib/complex-types';
import rehypeMathJaxSvg from 'rehype-mathjax';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import remarkMathPlugin from 'remark-math';
import ExternalFigurlFigure from './ExternalFigurlFigure';
import InternalFigurlFigure from './InternalFigurlFigure';
import MarkdownLink from './MarkdownLink';

type Props = {
  source: string;
  internalFigureMode: boolean;
};

const Markdown: FunctionComponent<Props> = ({ source, internalFigureMode }) => {
  const components: Partial<Omit<NormalComponents, keyof SpecialComponents> & SpecialComponents> = useMemo(
    () => ({
      code: ({ node, inline, className, children, ...props }) => {
        const match = /language-(\w+)/.exec(className || '');
        return !inline && match ? (
          <SyntaxHighlighter
            children={String(children).replace(/\n$/, '')}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            style={highlighterStyle as any}
            language={match[1]}
            PreTag="div"
            {...props}
          />
        ) : (
          <code className={className} {...props}>
            {children}
          </code>
        );
      },
      div: ({ node, className, children, ...props }) => {
        if (className === 'figurl-figure') {
          if (internalFigureMode) {
            return (
              <InternalFigurlFigure
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                src={(props as any).src}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                height={(props as any).height}
              />
            );
          } else {
            return (
              <ExternalFigurlFigure
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                src={(props as any).src}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                height={(props as any).height}
              />
            );
          }
        } else {
          return (
            <div className={className} {...props}>
              {children}
            </div>
          );
        }
      },
      a: ({ node, children, href, ...props }) => {
        if (href && href.startsWith('#')) {
          return <MarkdownLink href={href}>{children}</MarkdownLink>;
        } else {
          return (
            <a href={href} {...props}>
              {children}
            </a>
          );
        }
      },
    }),
    [internalFigureMode]
  );
  return (
    <div className="markdown-body">
      <ReactMarkdown
        children={source}
        remarkPlugins={[remarkGfm, remarkMathPlugin]}
        rehypePlugins={[rehypeRaw, rehypeMathJaxSvg /*, rehypeKatexPlugin*/]}
        components={components}
        linkTarget="_blank"
      />
    </div>
  );
};

export default Markdown;
