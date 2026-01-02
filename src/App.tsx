import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { ResearchPapers as ResearchPapersDAG } from './pages/ResearchPapers';
import { ResearchPapers as ResearchPapersTree } from './pages/ResearchPapersTree';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/research" element={<ResearchPapersTree />} />
        <Route path="/research/dag" element={<ResearchPapersDAG />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
