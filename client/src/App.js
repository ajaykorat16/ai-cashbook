import 'primereact/resources/themes/lara-light-indigo/theme.css';
import "primereact/resources/primereact.min.css";
import 'bootstrap/dist/css/bootstrap.css';
import './index.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ChartOfAccounts from './pages/ChartOfAccounts';
import UserRoutes from './Routes/UserRoutes';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/user/*" element={<UserRoutes />}>
          <Route path="chart-of-accounts/:id" element={<ChartOfAccounts />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
