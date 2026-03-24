# Database Schema

## Tables

### rooms
```sql
CREATE TABLE rooms (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  capacity INT NOT NULL,
  location VARCHAR(255),
  amenities TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### bookings
```sql
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  room_id INT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  student_id VARCHAR(255) NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  purpose VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_time_range CHECK (start_time < end_time),
  CONSTRAINT no_overlap EXCLUDE USING GIST (
    room_id WITH =,
    tsrange(start_time, end_time) WITH &&
  )
);
```

## Key Features

### Overlap Prevention
The `no_overlap` constraint uses PostgreSQL's GIST (Generalized Search Tree) index with the `tsrange` (timestamp range) type to prevent overlapping bookings for the same room.

This happens automatically at the database level - any insert/update that violates this constraint will be rejected with an error.

### Indexes
- `idx_bookings_room_id` - Fast lookups by room
- `idx_bookings_start_time` - Fast lookups by time
- `idx_bookings_student_id` - Fast lookups by student

## Common Queries

### Find overlapping bookings (for reference)
```sql
SELECT * FROM bookings
WHERE room_id = ?
AND start_time < ?
AND end_time > ?;
```

### Get room availability for a date
```sql
SELECT start_time, end_time FROM bookings
WHERE room_id = ?
AND start_time >= ? AND end_time <= ?
ORDER BY start_time;
```

### Get student's bookings
```sql
SELECT b.*, r.name as room_name FROM bookings b
JOIN rooms r ON b.room_id = r.id
WHERE b.student_id = ?
ORDER BY b.start_time DESC;
```

## Troubleshooting

### Enable GIST support
If you get "GIST index isn't available", run:
```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;
```

### Reset database
```sql
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS rooms;
-- Then run npm run setup-db again
```
