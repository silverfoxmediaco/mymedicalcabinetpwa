import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Import existing pages only
import StyleGuideOption1 from './pages/StyleGuideOption1';
import StyleGuideOption2 from './pages/StyleGuideOption2';
import Proposal from './pages/Proposal';
import SharedRecords from './pages/SharedRecords';
import MyDashboard from './pages/MyDashboard';

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<StyleGuideOption1 />} />
          <Route path="/style-guide-1" element={<StyleGuideOption1 />} />
          <Route path="/style-guide-2" element={<StyleGuideOption2 />} />
          <Route path="/proposal" element={<Proposal />} />
          <Route path="/dashboard" element={<MyDashboard />} />
          <Route path="/shared-records/:accessCode" element={<SharedRecords />} />
          <Route path="*" element={<StyleGuideOption1 />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
