import React, { useState } from 'react';

const CityBuilder = ({ user }) => {
  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-12 text-center mb-4">
          <h1 className="display-4 fw-bold text-primary mb-3">City Builder</h1>
          <p className="lead text-muted">
            Create and design your own virtual city with buildings and streets
          </p>
        </div>
        <div className="col-12">
          <div className="alert alert-info">
            <h4>City Builder Tool</h4>
            <p>This interactive city building tool is temporarily under maintenance. Please check back soon!</p>
            <p>Features will include:</p>
            <ul>
              <li>Drag and drop buildings</li>
              <li>Street placement</li>
              <li>City statistics</li>
              <li>Export capabilities</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CityBuilder;