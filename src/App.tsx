import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { ResearchPapers } from './pages/ResearchPapers';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/research" element={<ResearchPapers />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
