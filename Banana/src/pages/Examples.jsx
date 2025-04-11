import React from 'react';
import CodeExample from '../components/CodeExample';
import '../styles/pages/Examples.css';

const examples = [
  {
    title: 'Counter Component',
    description: 'Simple stateful counter component',
    code: `import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}`,
    type: 'react'
  },
  {
    title: 'Todo List',
    description: 'Basic todo list with state management',
    code: `const { createApp, ref } = Banana;

createApp({
  el: '#app',
  setup() {
    const todos = ref([]);
    const newTodo = ref('');

    function addTodo() {
      todos.value.push(newTodo.value);
      newTodo.value = '';
    }

    return { todos, newTodo, addTodo };
  }
});`,
    type: 'banana'
  }
];

export default function Examples() {
  return (
    <div className="examples-page">
      <h1>BananaJS Examples</h1>
      <p className="subtitle">Practical code examples to get you started</p>
      
      <div className="examples-grid">
        {examples.map((example, index) => (
          <CodeExample
            key={index}
            title={example.title}
            description={example.description}
            code={example.code}
            type={example.type}
          />
        ))}
      </div>
    </div>
  );
}