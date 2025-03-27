import React, { useState, useEffect } from 'react';
import ReactDOM from "react-dom"
import Leaderboard from "./LeaderboardComp"

import "./index.css"

import mockDataPersuasion from "./mocks/results_new.json"

const LeaderboardTabs = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return (
    <div className="tabs-container">
      <ul className={`tabs ${isMobile ? 'mobile' : ''}`}>
        <li className="is-active"><a>ChangeMyView</a></li>
      </ul>
      <div className="tab-content">
        <Leaderboard theme={{ base: "light" }} args={mockDataPersuasion} />
      </div>
    </div>
  );
};

const App = () => {
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  
  const toggleLeaderboard = (show: boolean) => {
    setShowLeaderboard(show);
  };
  
  return (
    <section className="hero">
      <div className="hero-body">
        <div className="container is-max-desktop">
          <div className="columns is-centered">
            <div className="column has-text-centered">
              <h1 className="title is-1 publication-title">
                PersuasionIndex: Benchmarking the Persuasion Capabilities of LLMs in the Wild
              </h1>
              <div className="column has-text-centered">
                <div className="publication-links">
                  <span className="link-block">
                    <a href=""
                      className="external-link button is-normal is-rounded is-dark">
                      <span className="icon">
                        <i className="fas fa-file-pdf"></i>
                      </span>
                      <span>Paper</span>
                    </a>
                  </span>

                  <span className="link-block">
                    <a href=""
                      className="external-link button is-normal is-rounded is-dark">
                      <span className="icon">
                        <i className="fab fa-github"></i>
                      </span>
                      <span>Code</span>
                    </a>
                  </span>

                  <span className="link-block">
                    <a href=""
                      className="external-link button is-normal is-rounded is-dark">
                      <span className="icon">
                        <i className="far fa-images"></i>
                      </span>
                      <span>Data</span>
                    </a>
                  </span>

                  <span className="link-block">
                    <a
                      href="#"
                      onClick={(e) => {e.preventDefault(); toggleLeaderboard(false);}}
                      className="external-link button is-normal is-rounded is-dark"
                    >
                      <span className="icon">
                        <i className="fas fa-home"></i>
                      </span>
                      <span>Home</span>
                    </a>
                  </span>

                  <span className="link-block">
                    <a
                      href="#"
                      onClick={(e) => {e.preventDefault(); toggleLeaderboard(true);}}
                      className="external-link button is-normal is-rounded is-dark"
                    >
                      <span className="icon">
                        <i className="fas fa-trophy"></i>
                      </span>
                      <span>Leaderboard</span>
                    </a>
                  </span>
                </div>
              </div>
              
              <div className="column has-text-centered" id="leaderboard">
                {showLeaderboard ? (
                  <LeaderboardTabs />
                ) : (
                  <div className="content">
                    <h2 className="title is-3">Welcome to PersuasionIndex</h2>
                    <p>This project benchmarks the persuasion capabilities of Large Language Models in the wild.</p>
                    <p>Click on "Leaderboard" to view the current rankings.</p>
                  </div>
                )}
              </div>

              <section className="section">
                <div className="container is-max-desktop">
                  <div className="columns is-centered has-text-centered">
                    <div className="column is-four-fifths">
                      <h2 className="title is-3">Submitting Custom Models</h2>
                      <div className="content has-text-justified">
                        <p>
                          To submit models you can create a pull request on our <a
                            href="https://github.com/LiveCodeBench/submissions">Github</a>. Particularly, you can copy your model
                          generations folder from `output` to the `submissions` folder and create a pull request. We will review the
                          submission and add the model to the leaderboard accordingly.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root")
)