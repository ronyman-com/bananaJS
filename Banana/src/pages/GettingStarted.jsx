import React from 'react';
import CodeBlock from '../components/CodeBlock';
import '../styles/pages/GettingStarted.css';

export default function GettingStarted() {
  return (
    <div className="getting-started">
      <h1>Getting Started with BananaJS</h1>
      
      <section>
        <h2>Installation</h2>
        <CodeBlock language="bash">
          npm install @ronyman/bananajs
          # or
          yarn add @ronyman/bananajs
        </CodeBlock>
      </section>

      <section>
        <h2>Create a New Project</h2>
        <CodeBlock language="bash">
          npx banana create my-app
          cd my-app
          npm run dev
        </CodeBlock>
      </section>

      <section>
        <h2>Basic Usage</h2>
      
      </section>
    </div>
  );
}