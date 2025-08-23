import React, { useState, useEffect } from 'react';

const LessonPlans = ({ user }) => {
  const [lessonPlans, setLessonPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    teacher: '',
    date: '',
    subject: '',
    topic: '',
    standards: '',
    iCanStatements: '',
    academicVocabulary: '',
    dokQuestions: '',
    warmUp: {
      timeAllotted: '',
      teacherWill: '',
      studentsWill: '',
      instructionTypes: []
    },
    explore: {
      timeAllotted: '',
      teacherWill: '',
      studentsWill: '',
      instructionTypes: []
    },
    explain: {
      timeAllotted: '',
      teacherWill: '',
      studentsWill: '',
      instructionTypes: []
    },
    elaborate: {
      timeAllotted: '',
      teacherWill: '',
      studentsWill: '',
      instructionTypes: []
    },
    evaluate: {
      timeAllotted: '',
      teacherWill: '',
      studentsWill: ''
    },
    totalTime: '90 mins',
    evaluation: '',
    reflection: ''
  });

  const instructionTypeOptions = [
    'Teacher Directed Instruction',
    'Guided Practice',
    'Independent Practice/Learning Tasks',
    'Collaborative learning',
    'Student Discourse'
  ];

  useEffect(() => {
    fetchLessonPlans();
  }, []);

  const fetchLessonPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/lesson-plans', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setLessonPlans(data);
      } else {
        setError('Failed to fetch lesson plans');
      }
    } catch (error) {
      console.error('Error fetching lesson plans:', error);
      setError('Failed to fetch lesson plans');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [section, field] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleInstructionTypeChange = (section, type) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        instructionTypes: prev[section].instructionTypes.includes(type)
          ? prev[section].instructionTypes.filter(t => t !== type)
          : [...prev[section].instructionTypes, type]
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingPlan ? `/api/lesson-plans/${editingPlan.id}` : '/api/lesson-plans';
      const method = editingPlan ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchLessonPlans();
        resetForm();
        setShowCreateForm(false);
        setEditingPlan(null);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save lesson plan');
      }
    } catch (error) {
      console.error('Error saving lesson plan:', error);
      setError('Failed to save lesson plan');
    }
  };

  const handleEdit = (plan) => {
    setFormData(plan);
    setEditingPlan(plan);
    setShowCreateForm(true);
  };

  const handleDelete = async (planId) => {
    if (window.confirm('Are you sure you want to delete this lesson plan?')) {
      try {
        const response = await fetch(`/api/lesson-plans/${planId}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        if (response.ok) {
          await fetchLessonPlans();
        } else {
          setError('Failed to delete lesson plan');
        }
      } catch (error) {
        console.error('Error deleting lesson plan:', error);
        setError('Failed to delete lesson plan');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      teacher: '',
      date: '',
      subject: '',
      topic: '',
      standards: '',
      iCanStatements: '',
      academicVocabulary: '',
      dokQuestions: '',
      warmUp: {
        timeAllotted: '',
        teacherWill: '',
        studentsWill: '',
        instructionTypes: []
      },
      explore: {
        timeAllotted: '',
        teacherWill: '',
        studentsWill: '',
        instructionTypes: []
      },
      explain: {
        timeAllotted: '',
        teacherWill: '',
        studentsWill: '',
        instructionTypes: []
      },
      elaborate: {
        timeAllotted: '',
        teacherWill: '',
        studentsWill: '',
        instructionTypes: []
      },
      evaluate: {
        timeAllotted: '',
        teacherWill: '',
        studentsWill: ''
      },
      totalTime: '90 mins',
      evaluation: '',
      reflection: ''
    });
  };

  const renderInstructionSection = (sectionName, sectionData, title) => (
    <div className="card mb-4">
      <div className="card-header">
        <h5 className="mb-0">{title}</h5>
      </div>
      <div className="card-body">
        <div className="row">
          <div className="col-md-4 mb-3">
            <label className="form-label">Time Allotted</label>
            <input
              type="text"
              className="form-control"
              name={`${sectionName}.timeAllotted`}
              value={sectionData.timeAllotted}
              onChange={handleInputChange}
              placeholder="e.g., 15 mins"
            />
          </div>
        </div>
        
        <div className="mb-3">
          <label className="form-label">Teacher will:</label>
          <textarea
            className="form-control"
            name={`${sectionName}.teacherWill`}
            value={sectionData.teacherWill}
            onChange={handleInputChange}
            rows="3"
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Students will:</label>
          <textarea
            className="form-control"
            name={`${sectionName}.studentsWill`}
            value={sectionData.studentsWill}
            onChange={handleInputChange}
            rows="3"
          />
        </div>

        {sectionData.instructionTypes !== undefined && (
          <div className="mb-3">
            <label className="form-label">Instruction Types:</label>
            <div className="row">
              {instructionTypeOptions.map(type => (
                <div key={type} className="col-md-6 mb-2">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`${sectionName}-${type}`}
                      checked={sectionData.instructionTypes.includes(type)}
                      onChange={() => handleInstructionTypeChange(sectionName, type)}
                    />
                    <label className="form-check-label" htmlFor={`${sectionName}-${type}`}>
                      {type}
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (!user || (!user.isAdmin && user.role !== 'teacher')) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning">
          <h4>Access Restricted</h4>
          <p>Only teachers and administrators can access lesson plans.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h2">
          <i className="fas fa-clipboard-list me-2"></i>
          Lesson Plans
        </h1>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setEditingPlan(null);
            setShowCreateForm(true);
          }}
        >
          <i className="fas fa-plus me-2"></i>
          Create New Lesson Plan
        </button>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      {showCreateForm && (
        <div className="card mb-4">
          <div className="card-header">
            <h4>{editingPlan ? 'Edit Lesson Plan' : 'Create New Lesson Plan'}</h4>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              {/* Basic Information */}
              <div className="row mb-4">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Title *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Teacher</label>
                  <input
                    type="text"
                    className="form-control"
                    name="teacher"
                    value={formData.teacher}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-control"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Subject</label>
                  <input
                    type="text"
                    className="form-control"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Topic/Unit</label>
                  <input
                    type="text"
                    className="form-control"
                    name="topic"
                    value={formData.topic}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Standards and Objectives */}
              <div className="mb-4">
                <label className="form-label">Standards</label>
                <textarea
                  className="form-control"
                  name="standards"
                  value={formData.standards}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>

              <div className="mb-4">
                <label className="form-label">I Can Statement(s)</label>
                <textarea
                  className="form-control"
                  name="iCanStatements"
                  value={formData.iCanStatements}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>

              <div className="mb-4">
                <label className="form-label">Academic Vocabulary</label>
                <textarea
                  className="form-control"
                  name="academicVocabulary"
                  value={formData.academicVocabulary}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>

              <div className="mb-4">
                <label className="form-label">Higher Order Thinking/Depth of Knowledge (DOK) Questions</label>
                <textarea
                  className="form-control"
                  name="dokQuestions"
                  value={formData.dokQuestions}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>

              {/* Instruction Sections */}
              <h4 className="mb-3">Instruction</h4>
              {renderInstructionSection('warmUp', formData.warmUp, 'Warm-Up/Hook (Engage)')}
              {renderInstructionSection('explore', formData.explore, 'Explore - Activating Strategy')}
              {renderInstructionSection('explain', formData.explain, 'Explain - Lecture/Builder')}
              {renderInstructionSection('elaborate', formData.elaborate, 'Elaborate - Instructional Activities')}
              {renderInstructionSection('evaluate', formData.evaluate, 'Evaluate - Closing/Wrap-Up')}

              {/* Total Time */}
              <div className="row mb-4">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Total Time</label>
                  <input
                    type="text"
                    className="form-control"
                    name="totalTime"
                    value={formData.totalTime}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Evaluation and Reflection */}
              <div className="mb-4">
                <label className="form-label">How will you evaluate student learning? (Check For Understanding)</label>
                <textarea
                  className="form-control"
                  name="evaluation"
                  value={formData.evaluation}
                  onChange={handleInputChange}
                  rows="4"
                />
              </div>

              <div className="mb-4">
                <label className="form-label">Reflection</label>
                <textarea
                  className="form-control"
                  name="reflection"
                  value={formData.reflection}
                  onChange={handleInputChange}
                  rows="4"
                />
              </div>

              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-success">
                  <i className="fas fa-save me-2"></i>
                  {editingPlan ? 'Update Plan' : 'Create Plan'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingPlan(null);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lesson Plans List */}
      {loading ? (
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <div className="row">
          {lessonPlans.length === 0 ? (
            <div className="col-12">
              <div className="text-center py-5">
                <i className="fas fa-clipboard-list fa-3x text-muted mb-3"></i>
                <h3 className="text-muted">No lesson plans yet</h3>
                <p className="text-muted">Create your first lesson plan to get started.</p>
              </div>
            </div>
          ) : (
            lessonPlans.map(plan => (
              <div key={plan.id} className="col-lg-6 col-xl-4 mb-4">
                <div className="card h-100">
                  <div className="card-body">
                    <h5 className="card-title">{plan.title}</h5>
                    <div className="small text-muted mb-2">
                      <div><strong>Subject:</strong> {plan.subject}</div>
                      <div><strong>Topic:</strong> {plan.topic}</div>
                      <div><strong>Date:</strong> {plan.date}</div>
                      <div><strong>Total Time:</strong> {plan.totalTime}</div>
                    </div>
                    <div className="small text-muted">
                      Created by {plan.creatorName} • {new Date(plan.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="card-footer bg-transparent">
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => handleEdit(plan)}
                      >
                        <i className="fas fa-edit me-1"></i>
                        Edit
                      </button>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleDelete(plan.id)}
                      >
                        <i className="fas fa-trash me-1"></i>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default LessonPlans;