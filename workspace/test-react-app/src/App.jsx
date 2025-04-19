import React, { Suspense } from 'react';
import './styles/App.scss';

const LazyComponent = React.lazy(() => import('./components/LazyComponent'));

export default function App() {
  return (
    <div>
      <h1>Welcome to Banana.js with React!</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <LazyComponent />
      </Suspense>
    </div>
  );
}