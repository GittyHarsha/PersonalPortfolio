// Simple dev server to handle file writes
import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const PAPERS_FILE = path.join(__dirname, 'public', 'papers.json');

// GET papers
app.get('/api/papers', (req, res) => {
  try {
    const data = fs.readFileSync(PAPERS_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('Error reading papers.json:', error);
    res.status(500).json({ error: 'Failed to read papers' });
  }
});

// POST/PUT papers (save changes)
app.post('/api/papers', (req, res) => {
  try {
    const data = JSON.stringify(req.body, null, 2);
    fs.writeFileSync(PAPERS_FILE, data, 'utf8');
    console.log('✅ Saved changes to papers.json at', new Date().toLocaleTimeString());
    res.json({ success: true, message: 'Papers saved successfully' });
  } catch (error) {
    console.error('❌ Error writing papers.json:', error);
    res.status(500).json({ error: 'Failed to save papers' });
  }
});

app.listen(PORT, () => {
  console.log(`\n📝 Dev server running on http://localhost:${PORT}`);
  console.log(`✅ Ready to save changes to papers.json`);
  console.log(`📁 File location: ${PAPERS_FILE}\n`);
});
