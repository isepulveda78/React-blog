import React, { useState, useEffect } from 'react';

const AudioLists = ({ user }) => {
  const [audioLists, setAudioLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingList, setEditingList] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    audioFiles: []
  });
  const [loadingAudio, setLoadingAudio] = useState({}); // Track loading state for each audio file

  // Debug user permissions
  console.log('[Audio Lists] User received:', user);
  console.log('[Audio Lists] User isAdmin:', user?.isAdmin);
  console.log('[Audio Lists] User role:', user?.role);

  const isTeacherOrAdmin = user && (user.isAdmin || user.role === 'teacher');
  console.log('[Audio Lists] isTeacherOrAdmin:', isTeacherOrAdmin);

  useEffect(() => {
    fetchAudioLists();
  }, []);

  const fetchAudioLists = async () => {
    try {
      const response = await fetch('/api/audio-lists');
      if (response.ok) {
        const lists = await response.json();
        setAudioLists(lists);
      } else {
        console.error('Failed to fetch audio lists');
      }
    } catch (error) {
      console.error('Error fetching audio lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || formData.audioFiles.length === 0) {
      alert('Please provide a title and at least one audio file.');
      return;
    }

    try {
      const url = editingList ? `/api/audio-lists/${editingList.id}` : '/api/audio-lists';
      const method = editingList ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchAudioLists();
        resetForm();
        alert(editingList ? 'Audio list updated successfully!' : 'Audio list created successfully!');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to save audio list');
      }
    } catch (error) {
      console.error('Error saving audio list:', error);
      alert('Failed to save audio list');
    }
  };

  const handleDelete = async (listId) => {
    if (!confirm('Are you sure you want to delete this audio list?')) return;

    try {
      const response = await fetch(`/api/audio-lists/${listId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchAudioLists();
        alert('Audio list deleted successfully!');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to delete audio list');
      }
    } catch (error) {
      console.error('Error deleting audio list:', error);
      alert('Failed to delete audio list');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      audioFiles: []
    });
    setShowCreateForm(false);
    setEditingList(null);
  };

  const startEdit = (list) => {
    setFormData({
      title: list.title,
      description: list.description || '',
      audioFiles: list.audioFiles || []
    });
    setEditingList(list);
    setShowCreateForm(true);
  };

  const addAudioFile = () => {
    setFormData(prev => ({
      ...prev,
      audioFiles: [...prev.audioFiles, { name: '', url: '' }]
    }));
  };

  const updateAudioFile = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      audioFiles: prev.audioFiles.map((file, i) => 
        i === index ? { ...file, [field]: value } : file
      )
    }));
  };

  const removeAudioFile = (index) => {
    setFormData(prev => ({
      ...prev,
      audioFiles: prev.audioFiles.filter((_, i) => i !== index)
    }));
  };

  const convertGoogleDriveUrl = (url) => {
    // Convert Google Drive sharing URLs to direct download format
    if (url.includes('drive.google.com/file/d/')) {
      const fileId = url.match(/\/d\/(.*?)\/view/)?.[1] || url.match(/\/d\/(.*?)$/)?.[1];
      if (fileId) {
        return `https://drive.google.com/uc?export=download&id=${fileId}`;
      }
    }
    return url;
  };

  const playAudio = (audioUrl, audioName, listId, audioIndex) => {
    const audioKey = `${listId}-${audioIndex}`;
    
    // Set loading state for this specific audio file
    setLoadingAudio(prev => ({ ...prev, [audioKey]: true }));
    
    // Use the existing audio proxy system for Google Drive files
    const proxyUrl = `/api/audio-proxy?url=${encodeURIComponent(convertGoogleDriveUrl(audioUrl))}`;
    
    const audio = new Audio(proxyUrl);
    audio.volume = 0.7;
    
    // Clear loading state when audio can play
    audio.addEventListener('canplay', () => {
      setLoadingAudio(prev => ({ ...prev, [audioKey]: false }));
    });
    
    // Clear loading state on error
    audio.addEventListener('error', () => {
      setLoadingAudio(prev => ({ ...prev, [audioKey]: false }));
    });
    
    // Clear loading state when audio ends
    audio.addEventListener('ended', () => {
      setLoadingAudio(prev => ({ ...prev, [audioKey]: false }));
    });
    
    audio.play().catch(error => {
      console.error('Error playing audio:', error);
      setLoadingAudio(prev => ({ ...prev, [audioKey]: false }));
      alert(`Failed to play "${audioName}". Please check the audio URL.`);
    });
  };

  if (loading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading audio lists...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="display-4 fw-bold text-primary mb-2">Audio Lists</h1>
              <p className="lead text-muted">
                {isTeacherOrAdmin 
                  ? "Create and manage audio file collections for student listening practice"
                  : "Listen to audio collections created by your teachers"
                }
              </p>
            </div>
            {isTeacherOrAdmin && (
              <button
                className="btn btn-primary"
                onClick={() => setShowCreateForm(true)}
              >
                <i className="fas fa-plus me-2"></i>
                Create Audio List
              </button>
            )}
          </div>

          {/* Create/Edit Form */}
          {showCreateForm && (
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">
                  {editingList ? 'Edit Audio List' : 'Create New Audio List'}
                </h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="title" className="form-label">Title *</label>
                    <input
                      type="text"
                      id="title"
                      className="form-control"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="description" className="form-label">Description</label>
                    <textarea
                      id="description"
                      className="form-control"
                      rows="3"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <label className="form-label">Audio Files *</label>
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        onClick={addAudioFile}
                      >
                        <i className="fas fa-plus me-1"></i>
                        Add Audio File
                      </button>
                    </div>
                    
                    {formData.audioFiles.map((file, index) => (
                      <div key={index} className="card mb-2">
                        <div className="card-body">
                          <div className="row">
                            <div className="col-md-4">
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Audio name"
                                value={file.name}
                                onChange={(e) => updateAudioFile(index, 'name', e.target.value)}
                                required
                              />
                            </div>
                            <div className="col-md-6">
                              <input
                                type="url"
                                className="form-control"
                                placeholder="Google Drive share URL"
                                value={file.url}
                                onChange={(e) => updateAudioFile(index, 'url', e.target.value)}
                                required
                              />
                            </div>
                            <div className="col-md-2">
                              <button
                                type="button"
                                className="btn btn-outline-danger"
                                onClick={() => removeAudioFile(index)}
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          </div>
                          <small className="text-muted">
                            Share your Google Drive audio file and paste the link above
                          </small>
                        </div>
                      </div>
                    ))}
                    
                    {formData.audioFiles.length === 0 && (
                      <div className="text-center py-3 border border-dashed rounded">
                        <i className="fas fa-music fa-2x text-muted mb-2"></i>
                        <p className="text-muted">No audio files added yet</p>
                        <button
                          type="button"
                          className="btn btn-outline-primary"
                          onClick={addAudioFile}
                        >
                          Add First Audio File
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-success">
                      <i className="fas fa-save me-2"></i>
                      {editingList ? 'Update List' : 'Create List'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={resetForm}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Audio Lists Display */}
          {audioLists.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-list-ul fa-4x text-muted mb-3"></i>
              <h3 className="text-muted">No Audio Lists Yet</h3>
              <p className="text-muted">
                {isTeacherOrAdmin 
                  ? "Create your first audio list to share with students"
                  : "Your teachers haven't created any audio lists yet"
                }
              </p>
            </div>
          ) : (
            <div className="row">
              {audioLists.map((list) => (
                <div key={list.id} className="col-md-6 col-lg-4 mb-4">
                  <div className="card h-100">
                    <div className="card-header d-flex justify-content-between align-items-start">
                      <div>
                        <h5 className="card-title mb-1">{list.title}</h5>
                        <small className="text-muted">by {list.creatorName}</small>
                      </div>
                      {isTeacherOrAdmin && (user.isAdmin || list.creatorId === user.id) && (
                        <div className="btn-group">
                          <button
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => startEdit(list)}
                            title="Edit Audio List"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleDelete(list.id)}
                            title="Delete Audio List"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="card-body">
                      {list.description && (
                        <p className="card-text text-muted mb-3">{list.description}</p>
                      )}
                      
                      <div className="audio-files">
                        <h6 className="mb-2">
                          <i className="fas fa-headphones me-2"></i>
                          Audio Files ({list.audioFiles?.length || 0})
                        </h6>
                        
                        {list.audioFiles?.map((audio, index) => {
                          const audioKey = `${list.id}-${index}`;
                          const isLoadingThis = loadingAudio[audioKey];
                          
                          return (
                            <div key={index} className="d-flex justify-content-between align-items-center p-2 border rounded mb-2">
                              <div className="flex-grow-1">
                                <div className="fw-medium">{audio.name}</div>
                              </div>
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => playAudio(audio.url, audio.name, list.id, index)}
                                disabled={isLoadingThis}
                              >
                                {isLoadingThis ? (
                                  <div className="spinner-border spinner-border-sm" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                  </div>
                                ) : (
                                  <i className="fas fa-play"></i>
                                )}
                              </button>
                            </div>
                          );
                        }) || (
                          <div className="text-muted">No audio files</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="card-footer">
                      <small className="text-muted">
                        Created {new Date(list.createdAt).toLocaleDateString()}
                        {list.updatedAt !== list.createdAt && (
                          <> • Updated {new Date(list.updatedAt).toLocaleDateString()}</>
                        )}
                      </small>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AudioLists;