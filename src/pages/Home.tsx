import { Link } from 'react-router-dom';
import './Home.css';

export function Home() {
  return (
    <div className="home-container">
      <header>
        <h1>Harsha Narayana P</h1>
        <p>Software Engineer at <b>Microsoft</b> IDC Hyderabad.<br/> AI and problem solving enthusiast.</p>
      </header>

      <section>
        <h2>About</h2>
        <p>
          Passionate about AI, software development, and problem solving.
          <br/>
          B.Tech in Computer Science from <b>NIT Surathkal</b> (2025, 9.07 CGPA).
        </p>
      </section>

      <section>
        <h2>Projects</h2>
        <ul>
          <li><a href="https://github.com/GittyHarsha/AgentMemory" target="_blank" rel="noopener noreferrer">AgentMemory MCP server</a>: An MCP server to manage agentic memory</li>
        </ul>
      </section>
    <section>
      <h2>Research</h2>
      <p>
        Machine Unlearning research focusing on <strong>Zero Shot Class Unlearning</strong>: 
        Removing classes from classification models without retraining or accessing training data.
      </p>
      <Link to="/research" className="research-link">
        View the Research papers I am reading →
      </Link>
    </section>

      <section>
        <h2>Contact</h2>
        <ul className="contact-links">
          <li>
            <a href="mailto:hnarayana788@gmail.com">Email</a>
          </li>
          <li>
            <a href="https://github.com/GittyHarsha" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          </li>
          <li>
            <a href="https://linkedin.com/in/harsha-narayana-p-810b8a221" target="_blank" rel="noopener noreferrer">
              LinkedIn
            </a>
          </li>
        </ul>
      </section>
    </div>
  );
}
