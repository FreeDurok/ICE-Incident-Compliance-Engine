import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import HomePage from './pages/HomePage';
import BuilderPage from './pages/BuilderPage';
import EditIncidentPage from './pages/EditIncidentPage';
import IncidentsListPage from './pages/IncidentsListPage';
import IncidentDetailPage from './pages/IncidentDetailPage';

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <div className="nav-container">
            <Link to="/" className="nav-logo">
              ICE - Incident Compliance Engine
            </Link>
            <ul className="nav-menu">
              <li className="nav-item">
                <Link to="/" className="nav-link">Home</Link>
              </li>
              <li className="nav-item">
                <Link to="/builder" className="nav-link">🔧 Builder</Link>
              </li>
              <li className="nav-item">
                <Link to="/incidents" className="nav-link">Incidenti</Link>
              </li>
            </ul>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/builder" element={<BuilderPage />} />
            <Route path="/incidents" element={<IncidentsListPage />} />
            <Route path="/incidents/:id" element={<IncidentDetailPage />} />
            <Route path="/incidents/:id/edit" element={<EditIncidentPage />} />
          </Routes>
        </main>

        <footer className="footer">
          <p>ICE - Incident Compliance Engine | Tassonomia ACN TC-ACN v2.0</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
