const { React, useState, useEffect } = window;
const { Link } = "wouter";
const EducationalTools = ({ user }) => {
  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-12">
          <h1>Educational Tools</h1>
          <p>
            This is your educational tools page. Please add your content here.
          </p>

          {/* Add your original content here */}
        </div>
        <div className="mt-2">
          <div className="row">
            <div className="col-md-4">
              <div className="card p-2 text-center">
                <h3>
                  <a as={Link} href="/city-builder">
                    City Builder
                  </a>
                </h3>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card p-2 text-center">
                <h3>
                  <a as={Link} href="/bingo-generator">
                    Bingo Card Generator
                  </a>
                </h3>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card p-2 text-center">
                <h3>
                  <a href="/spanish-alphabet" onClick={(e) => {
                    e.preventDefault();
                    window.history.pushState({}, '', '/spanish-alphabet');
                    window.location.reload();
                  }}>
                    Spanish Alphabet Soundboard
                  </a>
                </h3>
                <p className="text-muted">Learn Spanish letters with audio</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card p-2 text-center">
                <h3>
                  <a href="/word-sorter" onClick={(e) => {
                    e.preventDefault();
                    window.history.pushState({}, '', '/word-sorter');
                    window.location.reload();
                  }}>
                    Word Sorter
                  </a>
                </h3>
                <p className="text-muted">Drag and drop words between lists</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.EducationalTools = EducationalTools;

// ES6 default export for Vite build
export default EducationalTools;
