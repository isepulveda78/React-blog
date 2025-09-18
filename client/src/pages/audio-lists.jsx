import React, { useState, useEffect } from 'react';

const AudioLists = ({ user }) => {
  const [audioLists, setAudioLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingList, setEditingList] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    audioFiles: []
  });
  const [loadingAudio, setLoadingAudio] = useState({}); // Track loading state for each audio file
  const [playingPlaylist, setPlayingPlaylist] = useState(null); // Track which playlist is playing
  const [currentAudioIndex, setCurrentAudioIndex] = useState(0); // Track current audio in playlist
  const [currentAudio, setCurrentAudio] = useState(null); // Track current Audio object

  // Debug user permissions
  console.log('[Audio Lists] User received:', user);
  console.log('[Audio Lists] User isAdmin:', user?.isAdmin);
  console.log('[Audio Lists] User role:', user?.role);

  const isTeacherOrAdmin = user && (user.isAdmin || user.role === 'teacher');
  console.log('[Audio Lists] isTeacherOrAdmin:', isTeacherOrAdmin);

  // Filter audio lists based on search query
  const filteredAudioLists = audioLists.filter(list => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    
    // Search in title
    if (list.title.toLowerCase().includes(query)) return true;
    
    // Search in description
    if (list.description && list.description.toLowerCase().includes(query)) return true;
    
    // Search in creator name
    if (list.creatorName && list.creatorName.toLowerCase().includes(query)) return true;
    
    // Search in audio file names
    if (list.audioFiles && list.audioFiles.some(audio => 
      audio.name.toLowerCase().includes(query)
    )) return true;
    
    return false;
  });

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

  const stopCurrentAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
    }
    setPlayingPlaylist(null);
    setCurrentAudioIndex(0);
    setLoadingAudio({});
  };

  const playAudio = (audioUrl, audioName, listId, audioIndex) => {
    // Stop any currently playing audio
    stopCurrentAudio();
    
    const audioKey = `${listId}-${audioIndex}`;
    
    // Set loading state for this specific audio file
    setLoadingAudio(prev => ({ ...prev, [audioKey]: true }));
    
    // Use the existing audio proxy system for Google Drive files
    const proxyUrl = `/api/audio-proxy?url=${encodeURIComponent(convertGoogleDriveUrl(audioUrl))}`;
    
    const audio = new Audio(proxyUrl);
    audio.volume = 0.7;
    setCurrentAudio(audio);
    
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
      setCurrentAudio(null);
    });
    
    audio.play().catch(error => {
      console.error('Error playing audio:', error);
      setLoadingAudio(prev => ({ ...prev, [audioKey]: false }));
      setCurrentAudio(null);
      alert(`Failed to play "${audioName}". Please check the audio URL.`);
    });
  };

  const playAllAudios = (list) => {
    if (!list.audioFiles || list.audioFiles.length === 0) {
      alert('No audio files in this list to play.');
      return;
    }

    // Stop any currently playing audio
    stopCurrentAudio();
    
    setPlayingPlaylist(list.id);
    setCurrentAudioIndex(0);
    playNextInPlaylist(list, 0);
  };

  const playNextInPlaylist = (list, index) => {
    if (index >= list.audioFiles.length) {
      // Playlist finished
      setPlayingPlaylist(null);
      setCurrentAudioIndex(0);
      setCurrentAudio(null);
      return;
    }

    const audioFile = list.audioFiles[index];
    const audioKey = `${list.id}-${index}`;
    
    // Set loading state for this specific audio file
    setLoadingAudio(prev => ({ ...prev, [audioKey]: true }));
    
    // Use the existing audio proxy system for Google Drive files
    const proxyUrl = `/api/audio-proxy?url=${encodeURIComponent(convertGoogleDriveUrl(audioFile.url))}`;
    
    const audio = new Audio(proxyUrl);
    audio.volume = 0.7;
    setCurrentAudio(audio);
    setCurrentAudioIndex(index);
    
    // Clear loading state when audio can play
    audio.addEventListener('canplay', () => {
      setLoadingAudio(prev => ({ ...prev, [audioKey]: false }));
    });
    
    // Clear loading state on error and move to next
    audio.addEventListener('error', () => {
      setLoadingAudio(prev => ({ ...prev, [audioKey]: false }));
      console.error(`Failed to load audio: ${audioFile.name}`);
      // Move to next audio after a brief delay
      setTimeout(() => playNextInPlaylist(list, index + 1), 1000);
    });
    
    // When audio ends, play the next one
    audio.addEventListener('ended', () => {
      setLoadingAudio(prev => ({ ...prev, [audioKey]: false }));
      playNextInPlaylist(list, index + 1);
    });
    
    audio.play().catch(error => {
      console.error('Error playing audio:', error);
      setLoadingAudio(prev => ({ ...prev, [audioKey]: false }));
      // Move to next audio after error
      setTimeout(() => playNextInPlaylist(list, index + 1), 1000);
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

          {/* Search Bar */}
          {audioLists.length > 0 && (
            <div className="mb-4">
              <div className="row justify-content-center">
                <div className="col-md-6">
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="fas fa-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search audio lists by title, description, creator, or audio file names..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      data-testid="search-audio-lists"
                    />
                    {searchQuery && (
                      <button
                        className="btn btn-outline-secondary"
                        type="button"
                        onClick={() => setSearchQuery('')}
                        title="Clear search"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    )}
                  </div>
                  {searchQuery && (
                    <small className="text-muted">
                      Found {filteredAudioLists.length} of {audioLists.length} audio lists
                    </small>
                  )}
                </div>
              </div>
            </div>
          )}

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
          ) : filteredAudioLists.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-search fa-4x text-muted mb-3"></i>
              <h3 className="text-muted">No Results Found</h3>
              <p className="text-muted">
                No audio lists match your search for "{searchQuery}"
              </p>
              <button 
                className="btn btn-outline-primary"
                onClick={() => setSearchQuery('')}
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="row">
              {filteredAudioLists.map((list) => (
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
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <h6 className="mb-0">
                            <i className="fas fa-headphones me-2"></i>
                            Audio Files ({list.audioFiles?.length || 0})
                          </h6>
                          {list.audioFiles && list.audioFiles.length > 1 && (
                            <div className="btn-group" role="group">
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => playAllAudios(list)}
                                disabled={playingPlaylist === list.id}
                                data-testid={`button-play-all-${list.id}`}
                              >
                                <i className="fas fa-play me-1"></i>
                                Play All
                              </button>
                              {playingPlaylist === list.id && (
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={stopCurrentAudio}
                                  data-testid={`button-stop-${list.id}`}
                                >
                                  <i className="fas fa-stop me-1"></i>
                                  Stop
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {list.audioFiles?.map((audio, index) => {
                          const audioKey = `${list.id}-${index}`;
                          const isLoadingThis = loadingAudio[audioKey];
                          const isCurrentlyPlaying = playingPlaylist === list.id && currentAudioIndex === index;
                          
                          return (
                            <div 
                              key={index} 
                              className={`d-flex justify-content-between align-items-center p-2 border rounded mb-2 ${
                                isCurrentlyPlaying ? 'border-success bg-success bg-opacity-10' : ''
                              }`}
                            >
                              <div className="flex-grow-1">
                                <div className={`fw-medium ${isCurrentlyPlaying ? 'text-success' : ''}`}>
                                  {isCurrentlyPlaying && <i className="fas fa-music me-2"></i>}
                                  {audio.name}
                                </div>
                                {isCurrentlyPlaying && (
                                  <small className="text-success">Currently playing...</small>
                                )}
                              </div>
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => playAudio(audio.url, audio.name, list.id, index)}
                                disabled={isLoadingThis}
                                data-testid={`button-play-${list.id}-${index}`}
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