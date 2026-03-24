# API Documentation

Base URL: `http://localhost:5000/api`

## Rooms Endpoints

### Get All Rooms
```bash
GET /rooms
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Conference Room A",
    "capacity": 20,
    "location": "Building A - Floor 2",
    "amenities": ["Projector", "Whiteboard", "TV"],
    "created_at": "2024-03-22T10:00:00.000Z"
  }
]
```

### Get Room by ID
```bash
GET /rooms/:id
```

**Response:**
```json
{
  "id": 1,
  "name": "Conference Room A",
  "capacity": 20,
  "location": "Building A - Floor 2",
  "amenities": ["Projector", "Whiteboard", "TV"],
  "created_at": "2024-03-22T10:00:00.000Z"
}
```

### Get Room Availability
```bash
GET /rooms/:id/availability?date=2024-03-22
```

**Query Parameters:**
- `date` (required): YYYY-MM-DD format

**Response:**
```json
{
  "room_id": 1,
  "date": "2024-03-22",
  "bookings": [
    {
      "start_time": "2024-03-22T10:00:00.000Z",
      "end_time": "2024-03-22T11:00:00.000Z"
    }
  ]
}
```

## Bookings Endpoints

### Create a Booking
```bash
POST /bookings
Content-Type: application/json

{
  "room_id": 1,
  "student_id": "CS001",
  "start_time": "2024-03-22T10:00:00Z",
  "end_time": "2024-03-22T11:00:00Z",
  "purpose": "Group study"
}
```

**Success Response (201):**
```json
{
  "message": "Booking created successfully",
  "booking": {
    "id": 5,
    "room_id": 1,
    "student_id": "CS001",
    "start_time": "2024-03-22T10:00:00.000Z",
    "end_time": "2024-03-22T11:00:00.000Z",
    "purpose": "Group study",
    "created_at": "2024-03-22T09:30:00.000Z"
  }
}
```

**Error Response (409):**
```json
{
  "error": "Room is already booked for this time slot"
}
```

### Get Bookings by Room
```bash
GET /bookings/room/:room_id
```

**Response:**
```json
[
  {
    "id": 5,
    "room_id": 1,
    "student_id": "CS001",
    "start_time": "2024-03-22T10:00:00.000Z",
    "end_time": "2024-03-22T11:00:00.000Z",
    "purpose": "Group study",
    "created_at": "2024-03-22T09:30:00.000Z"
  }
]
```

### Get Bookings by Student
```bash
GET /bookings/student/:student_id
```

**Response:**
```json
[
  {
    "id": 5,
    "room_id": 1,
    "student_id": "CS001",
    "start_time": "2024-03-22T10:00:00.000Z",
    "end_time": "2024-03-22T11:00:00.000Z",
    "purpose": "Group study",
    "created_at": "2024-03-22T09:30:00.000Z",
    "room_name": "Conference Room A"
  }
]
```

### Cancel a Booking
```bash
DELETE /bookings/:id
```

**Success Response (200):**
```json
{
  "message": "Booking cancelled successfully",
  "booking_id": 5
}
```

**Error Response (404):**
```json
{
  "error": "Booking not found"
}
```

## Error Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (missing/invalid fields) |
| 404 | Not Found |
| 409 | Conflict (overlap detected) |
| 500 | Server Error |

## Time Format

All times must be in ISO 8601 format (UTC):
- Format: `YYYY-MM-DDTHH:mm:ssZ`
- Example: `2024-03-22T14:30:00Z`

## Testing with cURL

### Get all rooms
```bash
curl http://localhost:5000/api/rooms
```

### Check availability for a room on a specific date
```bash
curl "http://localhost:5000/api/rooms/1/availability?date=2024-03-22"
```

### Create a booking
```bash
curl -X POST http://localhost:5000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "room_id": 1,
    "student_id": "CS001",
    "start_time": "2024-03-22T10:00:00Z",
    "end_time": "2024-03-22T11:00:00Z",
    "purpose": "Study group"
  }'
```

### Get student bookings
```bash
curl http://localhost:5000/api/bookings/student/CS001
```

### Cancel a booking
```bash
curl -X DELETE http://localhost:5000/api/bookings/5
```
