const { React, useState, useEffect } = window;
const { Link } = "wouter";

const EducationalTools = ({ user }) => {
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
        {/* City Builder */}
        <div className="col-md-6">
          <div className="card h-100 shadow-sm">
            <div className="card-body text-center">
              <div className="display-6 text-primary mb-3">🏗️</div>
              <h5 className="card-title">City Builder</h5>
              <p className="card-text">Design and build your own virtual cities with interactive drag-and-drop tools.</p>
              <a href="/city-builder" className="btn btn-primary" onClick={(e) => {
                e.preventDefault();
                window.history.pushState({}, '', '/city-builder');
                window.location.reload();
              }}>
                Start Building
              </a>
            </div>
          </div>
        </div>

        {/* Bingo Generator */}
        <div className="col-md-6">
          <div className="card h-100 shadow-sm">
            <div className="card-body text-center">
              <div className="display-6 text-primary mb-3">🎲</div>
              <h5 className="card-title">Bingo Card Generator</h5>
              <p className="card-text">Create custom bingo cards with number ranges and print-ready layouts.</p>
              <a href="/bingo-generator" className="btn btn-primary" onClick={(e) => {
                e.preventDefault();
                window.history.pushState({}, '', '/bingo-generator');
                window.location.reload();
              }}>
                Generate Cards
              </a>
            </div>
          </div>
        </div>

        {/* Spanish Alphabet */}
        <div className="col-md-6">
          <div className="card h-100 shadow-sm">
            <div className="card-body text-center">
              <div className="display-6 text-primary mb-3">🔤</div>
              <h5 className="card-title">Spanish Alphabet Soundboard</h5>
              <p className="card-text">Interactive Spanish letter learning with audio pronunciation and speech synthesis.</p>
              <a href="/spanish-alphabet" className="btn btn-primary" onClick={(e) => {
                e.preventDefault();
                window.history.pushState({}, '', '/spanish-alphabet');
                window.location.reload();
              }}>
                Learn Letters
              </a>
            </div>
          </div>
        </div>

        {/* Word Sorter */}
        <div className="col-md-6">
          <div className="card h-100 shadow-sm">
            <div className="card-body text-center">
              <div className="display-6 text-primary mb-3">📝</div>
              <h5 className="card-title">Word Sorter</h5>
              <p className="card-text">Drag and drop words between customizable lists for vocabulary activities with PDF export.</p>
              <a href="/word-sorter" className="btn btn-primary" onClick={(e) => {
                e.preventDefault();
                window.history.pushState({}, '', '/word-sorter');
                window.location.reload();
              }}>
                Sort Words
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.EducationalTools = EducationalTools;
