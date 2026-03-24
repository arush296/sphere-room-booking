# Room Booking Web App

A full-stack room booking system for college campuses that allows students to browse and reserve physical spaces with real-time availability tracking and conflict prevention.

## Features

✅ **Browse Rooms** - View all available rooms with capacity, location, and amenities
✅ **Real-time Availability** - See booked time slots with visual timeline
✅ **Book Rooms** - Reserve rooms with date/time selection and purpose specification
✅ **Manage Bookings** - View, track, and cancel your bookings
✅ **Overlap Prevention** - Automatic conflict detection prevents double-booking
✅ **Color-coded Timeline** - Visual representation of available/booked slots
✅ **Google Authentication** - Sign in with institutional Google account

## Tech Stack

- **Frontend**: React 18, Axios, date-fns
- **Backend**: Node.js, Express, PostgreSQL
- **Database**: PostgreSQL with overlap prevention constraints
- **Styling**: Custom CSS with responsive design

## Project Structure

```
room-booking-app/
├── backend/
│   ├── package.json
│   ├── server.js              # Express server entry point
│   ├── db.js                  # PostgreSQL connection
│   ├── routes/
│   │   ├── rooms.js           # Room endpoints
│   │   └── bookings.js        # Booking CRUD endpoints
│   ├── scripts/
│   │   └── setupDb.js         # Database initialization
│   └── .env.example           # Environment variables template
│
└── frontend/
    ├── package.json
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── App.js             # Main app component
    │   ├── App.css            # Global styles
    │   ├── index.js           # React entry point
    │   └── components/
    │       ├── RoomList.js        # Room cards
    │       ├── RoomList.css
    │       ├── BookingForm.js     # Room booking form
    │       ├── BookingForm.css
    │       ├── TimelineAvailability.js  # Visual timeline picker
    │       ├── TimelineAvailability.css
    │       ├── MyBookings.js      # Student's bookings
    │       └── MyBookings.css
    └── .env.example
```

## Setup Instructions

### Prerequisites
- Node.js (v14+) - Download from [nodejs.org](https://nodejs.org/)
- PostgreSQL (v12+) - Download from [postgresql.org](https://www.postgresql.org/)

### 1. Database Setup

```bash
# Create PostgreSQL database
createdb room_booking

# Or use psql:
psql -U postgres
CREATE DATABASE room_booking;
```

### 2. Backend Setup

```bash
cd backend

# Copy environment file
cp .env.example .env

# Edit .env with your PostgreSQL credentials
nano .env
# Update: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, GOOGLE_CLIENT_ID

# Install dependencies
npm install

# Initialize database schema and seed sample data
npm run setup-db

# Start backend server
npm run dev
# Server runs on http://localhost:5000
```

### 3. Frontend Setup

```bash
cd frontend

# Copy environment file
cp .env.example .env

# Update environment values in .env
# REACT_APP_API_URL=http://localhost:5000/api
# REACT_APP_GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com

# Install dependencies
npm install

# Start development server
npm start
# App opens on http://localhost:3000
```

## How to Use

1. **Sign in with Google**: Use your college Google account
2. Only `@goa.bits-pilani.ac.in` accounts are allowed
3. **Browse Rooms**: Click "Browse Rooms" to see all available spaces
4. **Select a Room**: Click "Book Room" on any room card
5. **Choose Date & Time**:
   - Select date in the date picker
   - Click available time slots in the timeline (green = available, red = booked)
   - Or manually set start/end times
6. **Add Purpose** (optional): Describe what you'll use the room for
7. **Confirm Booking**: Click "Confirm Booking" to reserve the room
8. **View Bookings**: Click "My Bookings" to see all your reservations
9. **Cancel Booking**: Cancel upcoming bookings if needed

## API Endpoints

### Rooms
- `GET /api/rooms` - Get all rooms
- `GET /api/rooms/:id` - Get room details
- `GET /api/rooms/:id/availability?date=YYYY-MM-DD` - Get availability for a date

### Bookings
- `POST /api/bookings` - Create a new booking
  ```json
  {
    "room_id": 1,
    "student_id": "CS001",
    "start_time": "2024-03-22T10:00:00Z",
    "end_time": "2024-03-22T11:00:00Z",
    "purpose": "Group study"
  }
  ```
- `GET /api/bookings/student/:student_id` - Get bookings by student
- `GET /api/bookings/room/:room_id` - Get bookings for a room
- `DELETE /api/bookings/:id` - Cancel a booking

### Auth
- `POST /api/auth/google-login` - Verify Google ID token and domain

  ```json
  {
    "credential": "google_id_token"
  }
  ```

  Only users with email ending in `@goa.bits-pilani.ac.in` are accepted.

## Sample Data

The database is seeded with 5 sample rooms:

- **Conference Room A** (20 capacity) - Building A, Floor 2
- **Study Room B** (6 capacity) - Library, Ground Floor
- **Lab Room C** (30 capacity) - Science Building, Floor 3
- **Seminar Hall D** (50 capacity) - Main Hall, Ground Floor
- **Meeting Room E** (10 capacity) - Admin Building, Floor 1

## Features Implemented

### ✅ Checklist Items

- [x] **End-to-end room booking flow**
  - Browse rooms → Select dates → Book room → View bookings

- [x] **Room availability with color-coded timeline**
  - Green = Available, Red = Booked, Blue = Selected

- [x] **PostgreSQL overlap prevention**
  - Database-level constraints prevent double-booking
  - GIST index on timerange for optimal performance

- [x] **Search/filter interface**
  - Browse all rooms with capacity, location, amenities

- [x] **Time-picker with timeline component**
  - Visual 8 AM - 9 PM timeline
  - 30-minute increment slots
  - Click to select booking times

- [x] **Room availability cards**
  - Room name, capacity, location, amenities
  - Hover effects and responsive design

- [x] **Booking confirmation modal**
  - Summary of room, date, time, purpose
  - Confirmation before booking

- [x] **Student booking management**
  - View all bookings
  - Cancel upcoming bookings
  - Track past bookings

## Future Enhancements

- 🔐 Role-based access control for admin-level actions
- 🔔 Email/SMS notifications for bookings
- ⭐ Room ratings and reviews
- 📊 Admin dashboard for analytics
- 🔄 Recurring bookings
- 💳 Payment integration if needed
- 📱 Mobile app

## Troubleshooting

**PostgreSQL Connection Error**
- Ensure PostgreSQL is running
- Check credentials in `.env` match your setup
- Verify database `room_booking` exists

**"Cannot find module" errors**
- Run `npm install` in both backend and frontend directories
- Delete `node_modules` and `package-lock.json`, then reinstall

**Port Already in Use**
- Backend (5000): Change `PORT` in `.env`
- Frontend (3000): `npm start` will prompt to use another port

**Database Setup Failed**
- Drop and recreate database: `dropdb room_booking && createdb room_booking`
- Run setup again: `npm run setup-db`

## Development Notes

- Google ID token is stored in localStorage for session continuity
- Times are handled in 24-hour format (08:00 - 21:00)
- All timestamps are in ISO 8601 format
- Responsive design works on mobile, tablet, and desktop

## License

MIT - Feel free to use this project for educational purposes.
