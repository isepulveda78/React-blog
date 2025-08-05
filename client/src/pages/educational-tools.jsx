const { React, useState, useEffect } = window;

const EducationalTools = ({ user }) => {
  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    window.location.reload();
  };

  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-12">
          <h1 className="display-4 fw-bold text-primary mb-4">Educational Tools</h1>
          <p className="lead text-muted mb-5">
            Interactive learning tools designed for engaging educational experiences.
          </p>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-sm">
            <div className="card-body text-center">
              <div className="display-6 text-primary mb-3">🏗️</div>
              <h5 className="card-title">City Builder</h5>
              <p className="card-text">Design and build your own virtual cities with drag-and-drop tools.</p>
              <button
                className="btn btn-primary"
                onClick={() => navigateTo('/city-builder')}
              >
                Start Building
              </button>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-sm">
            <div className="card-body text-center">
              <div className="display-6 text-primary mb-3">🎲</div>
              <h5 className="card-title">Bingo Card Generator</h5>
              <p className="card-text">Create custom bingo cards for educational activities and games.</p>
              <button
                className="btn btn-primary"
                onClick={() => navigateTo('/bingo-generator')}
              >
                Generate Cards
              </button>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-sm">
            <div className="card-body text-center">
              <div className="display-6 text-primary mb-3">🔤</div>
              <h5 className="card-title">Spanish Alphabet Soundboard</h5>
              <p className="card-text">Learn Spanish letters with interactive audio pronunciation.</p>
              <button
                className="btn btn-primary"
                onClick={() => navigateTo('/spanish-alphabet')}
              >
                Learn Letters
              </button>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-sm">
            <div className="card-body text-center">
              <div className="display-6 text-primary mb-3">📝</div>
              <h5 className="card-title">Word Sorter</h5>
              <p className="card-text">Drag and drop words between lists for vocabulary activities.</p>
              <button
                className="btn btn-primary"
                onClick={() => navigateTo('/word-sorter')}
              >
                Sort Words
              </button>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-sm">
            <div className="card-body text-center">
              <div className="display-6 text-primary mb-3">🎵</div>
              <h5 className="card-title">Sound Demo</h5>
              <p className="card-text">Explore audio features and sound integration examples.</p>
              <button
                className="btn btn-primary"
                onClick={() => navigateTo('/sound-demo')}
              >
                Try Sounds
              </button>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-sm">
            <div className="card-body text-center">
              <div className="display-6 text-primary mb-3">📚</div>
              <h5 className="card-title">MP3 Integration Guide</h5>
              <p className="card-text">Learn how to integrate audio files into educational content.</p>
              <button
                className="btn btn-primary"
                onClick={() => navigateTo('/mp3-guide')}
              >
                View Guide
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.EducationalTools = EducationalTools;
