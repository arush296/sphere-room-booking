const pool = require('../db');

async function setupDatabase() {
  try {
    console.log('Setting up database...');

    // Enable btree_gist extension for overlap prevention
    await pool.query(`CREATE EXTENSION IF NOT EXISTS btree_gist;`);
    console.log('✓ Extensions enabled');

    // Create rooms table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        capacity INT NOT NULL,
        location VARCHAR(255),
        amenities TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Rooms table created');

    // Create bookings table with overlap prevention via constraints
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        room_id INT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
        student_id VARCHAR(255) NOT NULL,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        purpose VARCHAR(500),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT valid_time_range CHECK (start_time < end_time)
      );
    `);
    console.log('✓ Bookings table created');
    
    // Add status column to existing bookings table if it doesn't exist
    await pool.query(`
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));
    `);
    console.log('✓ Status column added/verified');
    
    // Create composite constraint to prevent overlaps for approved bookings only
    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_approved_bookings_no_overlap 
      ON bookings (room_id, tsrange(start_time, end_time)) 
      WHERE status = 'approved';
    `);
    console.log('✓ Overlap prevention index for approved bookings created');

    // Create indexes for better query performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_room_id ON bookings(room_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_start_time ON bookings(start_time);
      CREATE INDEX IF NOT EXISTS idx_bookings_student_id ON bookings(student_id);
    `);
    console.log('✓ Indexes created');

    // Seed some sample rooms
    await pool.query(`
      INSERT INTO rooms (name, capacity, location, amenities) VALUES
      ('Conference Room A', 20, 'Building A - Floor 2', ARRAY['Projector', 'Whiteboard', 'TV']),
      ('Study Room B', 6, 'Library - Ground Floor', ARRAY['Whiteboard']),
      ('Lab Room C', 30, 'Science Building - Floor 3', ARRAY['Computers', 'Lab Equipment']),
      ('Seminar Hall D', 50, 'Main Hall - Ground Floor', ARRAY['Projector', 'Microphone', 'Seating']),
      ('Meeting Room E', 10, 'Admin Building - Floor 1', ARRAY['Table', 'Chairs'])
      ON CONFLICT DO NOTHING;
    `);
    console.log('✓ Sample rooms seeded');

    console.log('✅ Database setup completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Database setup failed:', err);
    process.exit(1);
  }
}

setupDatabase();
