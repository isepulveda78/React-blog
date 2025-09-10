import React, { useState, useEffect } from 'react';

const EducationalTools = ({ user }) => {
  // Check if user is a teacher or admin
  const isTeacherOrAdmin = user && (user.isAdmin || user.role === 'teacher');
  
  // Define all tools with their visibility rules
  const allTools = [
    {
      id: 'audio-quizzes',
      title: 'Audio Quizzes',
      description: 'Take audio-based multiple choice quizzes and get graded results',
      icon: 'fas fa-headphones fa-3x text-info',
      buttonClass: 'btn btn-info',
      route: '/audio-quizzes',
      visibleToStudents: true
    },
    {
      id: 'text-quizzes',
      title: 'Text Quizzes',
      description: 'Challenge yourself with text-based multiple choice quizzes',
      icon: 'fas fa-edit fa-3x text-success',
      buttonClass: 'btn btn-success',
      route: '/text-quizzes',
      visibleToStudents: true
    },
    {
      id: 'bingo-generator',
      title: 'Bingo Generator',
      description: 'Create custom bingo cards for educational activities',
      icon: 'fas fa-th-large fa-3x text-success',
      buttonClass: 'btn btn-success',
      route: '/bingo-generator',
      visibleToStudents: false
    },
    {
      id: 'word-bingo',
      title: 'Bingo',
      description: 'Create random bingo cards with custom vocabulary lists and export to PDF',
      icon: 'fas fa-font fa-3x text-primary',
      buttonClass: 'btn btn-primary',
      route: '/word-bingo',
      visibleToStudents: false
    },
    {
      id: 'spanish-alphabet',
      title: 'Spanish Alphabet',
      description: 'Interactive soundboard to learn Spanish letters with audio',
      icon: 'fas fa-volume-up fa-3x text-warning',
      buttonClass: 'btn btn-warning',
      route: '/spanish-alphabet',
      visibleToStudents: true
    },
    {
      id: 'code-evolution',
      title: 'Code Evolution',
      description: 'Visualize how code changes over time with engaging transitions',
      icon: 'fas fa-code fa-3x text-info',
      buttonClass: 'btn btn-info',
      route: '/code-evolution',
      visibleToStudents: false
    },
    {
      id: 'word-sorter',
      title: 'Word Sorter',
      description: 'Drag and drop words between lists for sorting activities',
      icon: 'fas fa-sort-alpha-down fa-3x text-info',
      buttonClass: 'btn btn-info',
      route: '/word-sorter',
      visibleToStudents: false
    },
    {
      id: 'listen-to-type',
      title: 'Listen to Type',
      description: 'Practice typing by listening to audio prompts and typing what you hear',
      icon: 'fas fa-keyboard fa-3x text-danger',
      buttonClass: 'btn btn-info',
      route: '/listen-to-type',
      visibleToStudents: false
    },
    {
      id: 'crossword-generator',
      title: 'Crossword Generator',
      description: 'Create custom crossword puzzles with across and down clues, then export as PDF',
      icon: 'fas fa-puzzle-piece fa-3x text-secondary',
      buttonClass: 'btn btn-info',
      route: '/crossword-generator',
      visibleToStudents: false
    },
    {
      id: 'audio-lists',
      title: 'Audio Lists',
      description: 'Create and manage lists of audio files from Google Drive for student listening practice',
      icon: 'fas fa-list-ul fa-3x text-primary',
      buttonClass: 'btn btn-primary',
      route: '/audio-lists',
      visibleToStudents: true
    },
    {
      id: 'lesson-plans',
      title: 'Lesson Plans',
      description: 'Create and manage comprehensive lesson plans with the 5E instructional model',
      icon: 'fas fa-clipboard-list fa-3x text-info',
      buttonClass: 'btn btn-info',
      route: '/lesson-plans',
      visibleToStudents: false
    },
    {
      id: 'google-slides',
      title: 'Google Slides',
      description: 'Manage and share Google Slides presentations with embedded previews',
      icon: 'fab fa-google fa-3x text-danger',
      buttonClass: 'btn btn-danger',
      route: '/google-slides',
      visibleToStudents: true
    }
  ];

  // Filter tools based on user role
  const visibleTools = allTools.filter(tool => {
    if (isTeacherOrAdmin) {
      return true; // Teachers and admins see all tools
    }
    return tool.visibleToStudents; // Students only see quiz tools
  });

  const handleToolNavigation = (route) => {
    // Use hash-based routing
    window.location.hash = route;
  };

  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-12 text-center mb-5">
          <h1 className="display-4 fw-bold text-primary mb-3">Educational Tools</h1>
          <p className="lead text-muted">
            {isTeacherOrAdmin 
              ? "Interactive learning tools designed to enhance education through engaging activities"
              : "Take quizzes and practice your skills with these learning tools"
            }
          </p>
          {!user && (
            <div className="alert alert-info">
              <i className="fas fa-info-circle me-2"></i>
              Please log in to access all educational tools
            </div>
          )}
        </div>
        
        <div className="mt-2">
          <div className="row">
            {visibleTools.map((tool) => (
              <div key={tool.id} className="col-md-6 col-lg-3 mb-4">
                <div className="card h-100 shadow-sm">
                  <div className="card-body text-center">
                    <div className="mb-3">
                      <i className={tool.icon}></i>
                    </div>
                    <h5 className="card-title">{tool.title}</h5>
                    <p className="card-text">{tool.description}</p>
                    <button 
                      className={tool.buttonClass}
                      onClick={() => handleToolNavigation(tool.route)}
                    >
                      Launch Tool
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {!isTeacherOrAdmin && user && (
            <div className="row mt-4">
              <div className="col-12 text-center">
                <div className="alert alert-light">
                  <h6 className="mb-2">
                    <i className="fas fa-graduation-cap me-2 text-primary"></i>
                    Student View
                  </h6>
                  <p className="mb-0 text-muted">
                    You're seeing student-focused tools. Teachers and administrators have access to additional educational tools for creating content and activities.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EducationalTools;