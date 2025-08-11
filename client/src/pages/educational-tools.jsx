import React, { useState, useEffect } from 'react';
const EducationalTools = ({ user }) => {
  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-12 text-center mb-5">
          <h1 className="display-4 fw-bold text-primary mb-3">Educational Tools</h1>
          <p className="lead text-muted">
            Interactive learning tools designed to enhance education through engaging activities
          </p>
        </div>
        <div className="mt-2">
          <div className="row">
            <div className="col-md-6 col-lg-3 mb-4">
              <div className="card h-100 shadow-sm">
                <div className="card-body text-center">
                  <div className="mb-3">
                    <i className="fas fa-city fa-3x text-primary"></i>
                  </div>
                  <h5 className="card-title">City Builder</h5>
                  <p className="card-text">Create and design your own virtual city with buildings and streets</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      window.history.pushState({}, '', '/city-builder');
                      window.dispatchEvent(new PopStateEvent('popstate'));
                    }}
                  >
                    Launch Tool
                  </button>
                </div>
              </div>
            </div>
            
            <div className="col-md-6 col-lg-3 mb-4">
              <div className="card h-100 shadow-sm">
                <div className="card-body text-center">
                  <div className="mb-3">
                    <i className="fas fa-th-large fa-3x text-success"></i>
                  </div>
                  <h5 className="card-title">Bingo Generator</h5>
                  <p className="card-text">Create custom bingo cards for educational activities</p>
                  <button 
                    className="btn btn-success"
                    onClick={() => {
                      window.history.pushState({}, '', '/bingo-generator');
                      window.dispatchEvent(new PopStateEvent('popstate'));
                    }}
                  >
                    Launch Tool
                  </button>
                </div>
              </div>
            </div>
            
            <div className="col-md-6 col-lg-3 mb-4">
              <div className="card h-100 shadow-sm">
                <div className="card-body text-center">
                  <div className="mb-3">
                    <i className="fas fa-volume-up fa-3x text-warning"></i>
                  </div>
                  <h5 className="card-title">Spanish Alphabet</h5>
                  <p className="card-text">Interactive soundboard to learn Spanish letters with audio</p>
                  <button 
                    className="btn btn-warning"
                    onClick={() => {
                      window.history.pushState({}, '', '/spanish-alphabet');
                      window.dispatchEvent(new PopStateEvent('popstate'));
                    }}
                  >
                    Launch Tool
                  </button>
                </div>
              </div>
            </div>

            <div className="col-md-6 col-lg-3 mb-4">
              <div className="card h-100 shadow-sm">
                <div className="card-body text-center">
                  <div className="mb-3">
                    <i className="fas fa-code fa-3x text-info"></i>
                  </div>
                  <h5 className="card-title">Code Evolution</h5>
                  <p className="card-text">Visualize how code changes over time with engaging transitions</p>
                  <button 
                    className="btn btn-info"
                    onClick={() => {
                      window.history.pushState({}, '', '/code-evolution');
                      window.dispatchEvent(new PopStateEvent('popstate'));
                    }}
                  >
                    Launch Tool
                  </button>
                </div>
              </div>
            </div>
            
            <div className="col-md-6 col-lg-3 mb-4">
              <div className="card h-100 shadow-sm">
                <div className="card-body text-center">
                  <div className="mb-3">
                    <i className="fas fa-sort-alpha-down fa-3x text-info"></i>
                  </div>
                  <h5 className="card-title">Word Sorter</h5>
                  <p className="card-text">Drag and drop words between lists for sorting activities</p>
                  <button 
                    className="btn btn-info"
                    onClick={() => {
                      window.history.pushState({}, '', '/word-sorter');
                      window.dispatchEvent(new PopStateEvent('popstate'));
                    }}
                  >
                    Launch Tool
                  </button>
                </div>
              </div>
            </div>
            
            <div className="col-md-6 col-lg-3 mb-4">
              <div className="card h-100 shadow-sm">
                <div className="card-body text-center">
                  <div className="mb-3">
                    <i className="fas fa-keyboard fa-3x text-danger"></i>
                  </div>
                  <h5 className="card-title">Listen to Type</h5>
                  <p className="card-text">Practice typing by listening to audio prompts and typing what you hear</p>
                  <button 
                    className="btn btn-danger"
                    onClick={() => {
                      window.history.pushState({}, '', '/listen-to-type');
                      window.dispatchEvent(new PopStateEvent('popstate'));
                    }}
                  >
                    Launch Tool
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EducationalTools;
