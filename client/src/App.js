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
import ThanksPage from './pages/ThanksPage';
import ResetPassword from './pages/ResetPassword';
import ForgotPassword from './pages/ForgotPassword';
import ClientsAccounts from './pages/ClientsAccounts';
import UploadClients from './components/UploadClients';
import UploadCsv from './pages/UploadCsv';
import Spreadsheet from './pages/Spreadsheet';
import UserCategory from './pages/UserCategory';
import UserList from './pages/UserList';
import GstReport from './pages/GstReport';
import ItrReport from './pages/ItrReport';
import AutoCategorize from './pages/AutoCategorize';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/forgot-password/" element={<ForgotPassword />} />
        <Route path="/thanks" element={<ThanksPage />} />
        <Route path="/user/*" element={<UserRoutes />}>
          <Route path="chart-of-accounts" element={<ClientsAccounts />} />
          <Route path="chart-of-accounts/:id" element={<ChartOfAccounts />} />
          <Route path="clients" element={<ClientList />} />
          <Route path="category" element={<UserCategory />} />
          <Route path="upload-clients" element={<UploadClients />} />
          <Route path="upload-csv" element={<UploadCsv />} />
          <Route path="spreadsheet/:id" element={<Spreadsheet />} />
          <Route path="auto-categorize" element={<AutoCategorize />} />
          <Route path="gst-report" element={<GstReport />} />
          <Route path="itr-report" element={<ItrReport />} />
        </Route>
        <Route path="/admin/*" element={<UserRoutes />}>
          <Route path="users" element={<UserList />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
