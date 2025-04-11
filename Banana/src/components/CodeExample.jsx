import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'prism-react-renderer';
import '../styles/pages/CodeExample.css';

export default function CodeExample({ title, description, code, type }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`code-example ${type}`}>
      <div className="example-header">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <div className="example-code">
        <button className="copy-btn" onClick={copyToClipboard}>
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <SyntaxHighlighter
          language="javascript"
          theme={null}
          code={code}
          className="code-block"
        >
          {({ className, style, tokens, getLineProps, getTokenProps }) => (
            <pre className={className} style={style}>
              {tokens.map((line, i) => (
                <div {...getLineProps({ line, key: i })}>
                  {line.map((token, key) => (
                    <span {...getTokenProps({ token, key })} />
                  ))}
                </div>
              ))}
            </pre>
          )}
        </SyntaxHighlighter>
      </div>
      <div className="example-footer">
        <span className={`example-type ${type}`}>
          {type === 'banana' ? 'BananaJS' : 'React'}
        </span>
      </div>
    </div>
  );
}