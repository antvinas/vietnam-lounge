import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import Home from './pages/Home';
import AdultGate from './pages/AdultGate';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'adult-gate', element: <AdultGate /> }
    ]
  }
]);
