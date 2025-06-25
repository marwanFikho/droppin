import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './App.css';
import './Dashboard.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import createDefaultUsers from './components/DefaultUsers';
import createMockPackages from './components/MockData';
import 'antd/dist/reset.css';

// Initialize default test users and mock data
createDefaultUsers();
createMockPackages();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
