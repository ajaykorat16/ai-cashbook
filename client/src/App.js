import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import 'bootstrap/dist/css/bootstrap.css';
import './index.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ChartOfAccounts from './pages/ChartOfAccounts';
import UserRoutes from './Routes/UserRoutes';
import ClientList from './pages/ClientList';
import ClientList from './pages/ThanksPage';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/thanks" element={<ThanksPage />} />
        <Route path="/user/*" element={<UserRoutes />}>
          <Route path="chart-of-accounts/:id" element={<ChartOfAccounts />} />
          <Route path="clients" element={<ClientList />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
