import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';

const TeacherDashboard = ({ user }) => {
  const [location, navigate] = useLocation();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [audioQuizGrades, setAudioQuizGrades] = useState([]);
  const [textQuizGrades, setTextQuizGrades] = useState([]);
  const [quizzes, setQuizzes] = useState({ audio: [], text: [] });
  const [selectedView, setSelectedView] = useState('overview');

  console.log('[TeacherDashboard] User:', user);
  console.log('[TeacherDashboard] User.role:', user?.role);
  
  if (!user || (user.role !== 'teacher' && !user.isAdmin)) {
    console.log('[TeacherDashboard] Access denied - no user or not teacher/admin');
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          Access denied. Teacher privileges required.
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchStudents();
    fetchQuizData();
  }, [user]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/teacher/students?teacherId=${user.id}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
        setError('');
      } else if (response.status === 403) {
        setError('Access denied. Teacher privileges required.');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch students');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Error fetching students. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizData = async () => {
    try {
      // Fetch quiz grades and quiz lists
      const [audioGradesRes, textGradesRes, audioQuizzesRes, textQuizzesRes] = await Promise.all([
        fetch('/api/quiz-grades', { credentials: 'include' }),
        fetch('/api/text-quiz-grades', { credentials: 'include' }),
        fetch('/api/audio-quizzes', { credentials: 'include' }),
        fetch('/api/text-quizzes', { credentials: 'include' })
      ]);

      if (audioGradesRes.ok) {
        const audioGrades = await audioGradesRes.json();
        setAudioQuizGrades(audioGrades);
      }

      if (textGradesRes.ok) {
        const textGrades = await textGradesRes.json();
        setTextQuizGrades(textGrades);
      }

      if (audioQuizzesRes.ok) {
        const audioQuizzesList = await audioQuizzesRes.json();
        setQuizzes(prev => ({ ...prev, audio: audioQuizzesList }));
      }

      if (textQuizzesRes.ok) {
        const textQuizzesList = await textQuizzesRes.json();
        setQuizzes(prev => ({ ...prev, text: textQuizzesList }));
      }
    } catch (error) {
      console.error('Error fetching quiz data:', error);
    }
  };

  // Filter grades for students assigned to this teacher
  const getMyStudentsGrades = (grades) => {
    const myStudentIds = students.map(student => student.id);
    return grades.filter(grade => myStudentIds.includes(grade.userId));
  };

  const getStudentStats = (studentId) => {
    const studentAudioGrades = audioQuizGrades.filter(grade => grade.userId === studentId);
    const studentTextGrades = textQuizGrades.filter(grade => grade.userId === studentId);
    
    const totalQuizzes = studentAudioGrades.length + studentTextGrades.length;
    const totalScore = [...studentAudioGrades, ...studentTextGrades].reduce((sum, grade) => sum + (grade.score || 0), 0);
    const averageScore = totalQuizzes > 0 ? Math.round(totalScore / totalQuizzes) : 0;
    
    return {
      totalQuizzes,
      averageScore,
      audioQuizzes: studentAudioGrades.length,
      textQuizzes: studentTextGrades.length
    };
  };

  const getQuizTitle = (quizId, quizType) => {
    const quizList = quizType === 'audio' ? quizzes.audio : quizzes.text;
    const quiz = quizList.find(q => q.id === quizId);
    return quiz ? quiz.title : `${quizType === 'audio' ? 'Audio' : 'Text'} Quiz`;
  };

  const renderOverview = () => (
    <div className="row g-4">
      <div className="col-12">
        <h2 className="mb-4">Dashboard Overview</h2>
      </div>
      
      <div className="col-md-6 col-lg-3">
        <div className="card h-100 bg-danger text-white">
          <div className="card-body text-center">
            <div className="display-4 mb-2">👥</div>
            <h3 className="card-title">{students.length}</h3>
            <p className="card-text">Total Students</p>
          </div>
        </div>
      </div>

      <div className="col-md-6 col-lg-3">
        <div className="card h-100 bg-success text-white">
          <div className="card-body text-center">
            <div className="display-4 mb-2">🎧</div>
            <h3 className="card-title">{getMyStudentsGrades(audioQuizGrades).length}</h3>
            <p className="card-text">Audio Quiz Attempts</p>
          </div>
        </div>
      </div>

      <div className="col-md-6 col-lg-3">
        <div className="card h-100 bg-info text-white">
          <div className="card-body text-center">
            <div className="display-4 mb-2">📝</div>
            <h3 className="card-title">{getMyStudentsGrades(textQuizGrades).length}</h3>
            <p className="card-text">Text Quiz Attempts</p>
          </div>
        </div>
      </div>

      <div className="col-md-6 col-lg-3">
        <div className="card h-100 bg-warning text-dark">
          <div className="card-body text-center">
            <div className="display-4 mb-2">⭐</div>
            <h3 className="card-title">
              {Math.round(
                [...getMyStudentsGrades(audioQuizGrades), ...getMyStudentsGrades(textQuizGrades)]
                  .reduce((sum, grade, _, arr) => sum + (grade.score || 0) / arr.length, 0)
              ) || 0}%
            </h3>
            <p className="card-text">Average Score</p>
          </div>
        </div>
      </div>

      <div className="col-12">
        <div className="card">
          <div className="card-header">
            <h4 className="mb-0">Quick Actions</h4>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-4">
                <button
                  className="btn btn-outline-primary w-100"
                  onClick={() => setSelectedView('students')}
                  data-testid="button-view-students"
                >
                  <i className="fas fa-users me-2"></i>
                  Manage Students
                </button>
              </div>
              <div className="col-md-4">
                <button
                  className="btn btn-outline-success w-100"
                  onClick={() => setSelectedView('quiz-scores')}
                  data-testid="button-view-quiz-scores"
                >
                  <i className="fas fa-chart-bar me-2"></i>
                  View Quiz Scores
                </button>
              </div>
              <div className="col-md-4">
                <button
                  className="btn btn-outline-info w-100"
                  onClick={() => navigate('/audio-quizzes')}
                  data-testid="button-create-quiz"
                >
                  <i className="fas fa-plus me-2"></i>
                  Create Quiz
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStudents = () => (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>My Students</h2>
        <button
          className="btn btn-secondary"
          onClick={() => setSelectedView('overview')}
          data-testid="button-back-overview"
        >
          <i className="fas fa-arrow-left me-2"></i>
          Back to Overview
        </button>
      </div>

      {students.length === 0 ? (
        <div className="alert alert-info">
          <h4>No Students Assigned</h4>
          <p>You don't have any students assigned to you yet. Students will appear here once they're assigned to your class.</p>
        </div>
      ) : (
        <div className="row g-4">
          {students.map(student => {
            const stats = getStudentStats(student.id);
            return (
              <div key={student.id} className="col-lg-6">
                <div className="card h-100">
                  <div className="card-body">
                    <div className="d-flex align-items-center mb-3">
                      <div className="me-3">
                        <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" 
                             style={{ width: '50px', height: '50px', fontSize: '20px' }}>
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <h5 className="mb-1" data-testid={`text-student-name-${student.id}`}>
                          {student.name}
                        </h5>
                        <p className="text-muted mb-0">{student.email}</p>
                      </div>
                    </div>
                    
                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <div className="text-center">
                          <div className="fw-bold text-primary">{stats.totalQuizzes}</div>
                          <small className="text-muted">Total Quizzes</small>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="text-center">
                          <div className="fw-bold text-success">{stats.averageScore}%</div>
                          <small className="text-muted">Average Score</small>
                        </div>
                      </div>
                    </div>
                    
                    <div className="small text-muted">
                      Audio: {stats.audioQuizzes} • Text: {stats.textQuizzes}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderQuizScores = () => {
    const myStudentsAudioGrades = getMyStudentsGrades(audioQuizGrades);
    const myStudentsTextGrades = getMyStudentsGrades(textQuizGrades);
    
    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Quiz Scores</h2>
          <button
            className="btn btn-secondary"
            onClick={() => setSelectedView('overview')}
            data-testid="button-back-overview"
          >
            <i className="fas fa-arrow-left me-2"></i>
            Back to Overview
          </button>
        </div>

        {/* Audio Quiz Scores */}
        <div className="mb-5">
          <h3 className="mb-3">Audio Quiz Scores</h3>
          {myStudentsAudioGrades.length === 0 ? (
            <div className="alert alert-info">No audio quiz attempts by your students yet.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Quiz</th>
                    <th>Score</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {myStudentsAudioGrades.map(grade => {
                    const student = students.find(s => s.id === grade.userId);
                    return (
                      <tr key={grade.id} data-testid={`row-audio-grade-${grade.id}`}>
                        <td data-testid={`text-student-${grade.id}`}>
                          {student ? student.name : 'Unknown Student'}
                        </td>
                        <td data-testid={`text-quiz-${grade.id}`}>
                          {getQuizTitle(grade.quizId, 'audio')}
                        </td>
                        <td data-testid={`text-score-${grade.id}`}>
                          <span className={`badge ${grade.score >= 70 ? 'bg-success' : 'bg-warning'}`}>
                            {grade.score}%
                          </span>
                        </td>
                        <td data-testid={`text-date-${grade.id}`}>
                          {new Date(grade.completedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Text Quiz Scores */}
        <div className="mb-5">
          <h3 className="mb-3">Text Quiz Scores</h3>
          {myStudentsTextGrades.length === 0 ? (
            <div className="alert alert-info">No text quiz attempts by your students yet.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Quiz</th>
                    <th>Score</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {myStudentsTextGrades.map(grade => {
                    const student = students.find(s => s.id === grade.userId);
                    return (
                      <tr key={grade.id} data-testid={`row-text-grade-${grade.id}`}>
                        <td data-testid={`text-student-${grade.id}`}>
                          {student ? student.name : 'Unknown Student'}
                        </td>
                        <td data-testid={`text-quiz-${grade.id}`}>
                          {getQuizTitle(grade.quizId, 'text')}
                        </td>
                        <td data-testid={`text-score-${grade.id}`}>
                          <span className={`badge ${grade.score >= 70 ? 'bg-success' : 'bg-warning'}`}>
                            {grade.score}%
                          </span>
                        </td>
                        <td data-testid={`text-date-${grade.id}`}>
                          {new Date(grade.completedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container py-5">
        <div className="d-flex justify-content-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5" style={{backgroundColor: '#f8f9fa', minHeight: '100vh'}}>
      <div className="row">
        <div className="col-12">
          <h1 className="display-4 fw-bold text-primary mb-4">Teacher Dashboard</h1>
          <p className="lead text-muted mb-5">
            Welcome, {user.name}! Manage your students and track their quiz performance.
          </p>
        </div>
      </div>

      {selectedView === 'overview' && renderOverview()}
      {selectedView === 'students' && renderStudents()}
      {selectedView === 'quiz-scores' && renderQuizScores()}
    </div>
  );
};

export default TeacherDashboard;