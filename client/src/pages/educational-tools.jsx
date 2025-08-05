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
          </div>
        </div>
      </div>
    </div>
  );
};

window.EducationalTools = EducationalTools;
