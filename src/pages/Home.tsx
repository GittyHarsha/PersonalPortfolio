import { Link } from 'react-router-dom';
import './Home.css';

export function Home() {
  return (
    <div className="home-container">
      <header>
        <h1>Harsha Narayana P</h1>
        <p>Software Engineer at Microsoft IDC Hyderabad. ML enthusiast.</p>
      </header>

      <section>
        <h2>About</h2>
        <p>
          I'm a software engineer passionate about machine learning and building 
          scalable systems. Currently working at Microsoft IDC Hyderabad.
        </p>
      </section>

      <section>
        <h2>Projects</h2>
        <ul>
          <li>Task Dependency Manager - Interactive DAG visualization tool</li>
          <li>Research Papers Reading Graph - Track paper dependencies</li>
          <li>More coming soon...</li>
        </ul>
      </section>

      <section>
        <h2>Research</h2>
        <p>
          <Link to="/research" className="research-link">
            View Interactive Reading Graph →
          </Link>
        </p>
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
