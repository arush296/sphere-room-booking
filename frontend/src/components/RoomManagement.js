import React, { useState } from 'react';
import axios from 'axios';
import './RoomManagement.css';

function RoomManagement({ rooms, onRoomUpdated, API_URL }) {
  const [editingRoom, setEditingRoom] = useState(null);
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    capacity: '',
    location: '',
    amenities: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleEditClick = (room) => {
    setEditingRoom(room.id);
    setFormData({
      name: room.name,
      capacity: room.capacity,
      location: room.location || '',
      amenities: room.amenities ? room.amenities.join(', ') : ''
    });
    setError('');
    setSuccess('');
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async (roomId) => {
    try {
      if (!formData.name.trim() || !formData.capacity) {
        setError('Name and capacity are required');
        return;
      }

      setLoading(true);
      const amenitiesArray = formData.amenities
        .split(',')
        .map(a => a.trim())
        .filter(a => a.length > 0);

      await axios.put(`${API_URL}/rooms/${roomId}`, {
        name: formData.name,
        capacity: parseInt(formData.capacity),
        location: formData.location,
        amenities: amenitiesArray
      });

      setSuccess('Room updated successfully!');
      setEditingRoom(null);
      setError('');
      onRoomUpdated();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update room');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoom = async () => {
    try {
      if (!formData.name.trim() || !formData.capacity) {
        setError('Name and capacity are required');
        return;
      }

      setLoading(true);
      const amenitiesArray = formData.amenities
        .split(',')
        .map(a => a.trim())
        .filter(a => a.length > 0);

      await axios.post(`${API_URL}/rooms`, {
        name: formData.name,
        capacity: parseInt(formData.capacity),
        location: formData.location,
        amenities: amenitiesArray
      });

      setSuccess('Room created successfully!');
      setIsAddingRoom(false);
      setFormData({
        name: '',
        capacity: '',
        location: '',
        amenities: ''
      });
      setError('');
      onRoomUpdated();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (roomId) => {
    if (window.confirm('Are you sure you want to delete this room? All associated bookings will be deleted.')) {
      try {
        setLoading(true);
        await axios.delete(`${API_URL}/rooms/${roomId}`);
        setSuccess('Room deleted successfully!');
        setEditingRoom(null);
        setError('');
        onRoomUpdated();

        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to delete room');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="room-management-container">
      <div className="management-header">
        <h2>Manage Rooms</h2>
        <button
          className="btn-add-room"
          onClick={() => {
            setIsAddingRoom(true);
            setEditingRoom(null);
            setError('');
            setSuccess('');
          }}
          disabled={loading}
        >
          Add New Room
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {isAddingRoom && (
        <div className="add-room-card">
          <div className="edit-form">
            <h3>Create New Room</h3>
            <div className="form-group">
              <label>Room Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                placeholder="e.g., Conference Room A"
              />
            </div>
            <div className="form-group">
              <label>Capacity</label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleFormChange}
                placeholder="e.g., 20"
                min="1"
              />
            </div>
            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleFormChange}
                placeholder="e.g., Building A - Floor 2"
              />
            </div>
            <div className="form-group">
              <label>Amenities (comma-separated)</label>
              <input
                type="text"
                name="amenities"
                value={formData.amenities}
                onChange={handleFormChange}
                placeholder="e.g., Projector, Whiteboard, WiFi"
              />
            </div>
            <div className="form-buttons">
              <button
                className="btn-save"
                onClick={handleAddRoom}
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Room'}
              </button>
              <button
                className="btn-cancel"
                onClick={() => {
                  setIsAddingRoom(false);
                  setFormData({
                    name: '',
                    capacity: '',
                    location: '',
                    amenities: ''
                  });
                }}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rooms-management-grid">
        {rooms.map((room) => (
          <div key={room.id} className="management-card">
            {editingRoom === room.id ? (
              <div className="edit-form">
                <h3>Edit Room</h3>
                <div className="form-group">
                  <label>Room Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="e.g., C308"
                  />
                </div>
                <div className="form-group">
                  <label>Capacity</label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleFormChange}
                    placeholder="e.g., 20"
                    min="1"
                  />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleFormChange}
                    placeholder="e.g., B Dome - C Wing"
                  />
                </div>
                <div className="form-group">
                  <label>Amenities (comma-separated)</label>
                  <input
                    type="text"
                    name="amenities"
                    value={formData.amenities}
                    onChange={handleFormChange}
                    placeholder="e.g., Projector, Whiteboard, WiFi"
                  />
                </div>
                <div className="form-buttons">
                  <button
                    className="btn-save"
                    onClick={() => handleSave(room.id)}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    className="btn-cancel"
                    onClick={() => setEditingRoom(null)}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="room-info">
                <h3>{room.name}</h3>
                <p><strong>Capacity:</strong> {room.capacity} people</p>
                <p><strong>Location:</strong> {room.location || 'N/A'}</p>
                {room.amenities && room.amenities.length > 0 && (
                  <div>
                    <strong>Amenities:</strong>
                    <div className="amenity-tags">
                      {room.amenities.map((amenity, idx) => (
                        <span key={idx} className="amenity-tag">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="management-buttons">
                  <button
                    className="btn-edit"
                    onClick={() => handleEditClick(room)}
                    disabled={loading}
                  >
                    Edit
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(room.id)}
                    disabled={loading}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {rooms.length === 0 && (
        <div className="no-rooms">
          <p>No rooms available</p>
        </div>
      )}
    </div>
  );
}

export default RoomManagement;
