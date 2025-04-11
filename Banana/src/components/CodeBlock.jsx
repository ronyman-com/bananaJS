import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'prism-react-renderer';
import '../styles/components/CodeBlock.css';

export default function CodeBlock({ language, children }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-block-container">
      <div className="code-block-header">
        <span className="language-label">{language}</span>
        <button 
          className="copy-button"
          onClick={copyToClipboard}
          aria-label="Copy code to clipboard"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        theme={null}
        code={children}
        className="code-block"
      >
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre className={className} style={style}>
            {tokens.map((line, i) => (
              <div {...getLineProps({ line, key: i })}>
                <span className="line-number">{i + 1}</span>
                {line.map((token, key) => (
                  <span {...getTokenProps({ token, key })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </SyntaxHighlighter>
    </div>
  );
}