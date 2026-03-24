import React from 'react';
import './TimelineAvailability.css';

function TimelineAvailability({ bookings, selectedDate, selectedStartTime, selectedEndTime, onTimeSelect }) {
  const hours = Array.from({ length: 15 }, (_, i) => i + 8); // 8 AM to 10 PM start (ends by 11 PM)

  const getMinutesFromHHMM = (hhmmStr) => {
    const [hoursPart, minutesPart] = (hhmmStr || '00:00').split(':').map(Number);
    return hoursPart * 60 + minutesPart;
  };

  const getMinutesFromDateTime = (dateTimeStr) => {
    const date = new Date(dateTimeStr);
    return date.getHours() * 60 + date.getMinutes();
  };

  const doesSlotOverlapBooking = (slotStartMinutes, slotEndMinutes) => {
    return bookings.some((booking) => {
      const bookingStartMinutes = booking.start_time_hhmm
        ? getMinutesFromHHMM(booking.start_time_hhmm)
        : getMinutesFromDateTime(booking.start_time);
      const bookingEndMinutes = booking.end_time_hhmm
        ? getMinutesFromHHMM(booking.end_time_hhmm)
        : getMinutesFromDateTime(booking.end_time);

      return slotStartMinutes < bookingEndMinutes && slotEndMinutes > bookingStartMinutes;
    });
  };

  const handleTimeSlotClick = (hour) => {
    const startTimeStr = `${String(hour).padStart(2, '0')}:00`;
    const endTimeStr = `${String(hour + 1).padStart(2, '0')}:00`;
    onTimeSelect(startTimeStr, endTimeStr);
  };

  const isPastSlot = (hour) => {
    if (!selectedDate) return false;
    const slotStart = new Date(`${selectedDate}T${String(hour).padStart(2, '0')}:00:00`);
    return slotStart <= new Date();
  };

  return (
    <div className="timeline-container">
      <div className="timeline-legend">
        <div className="legend-item">
          <div className="legend-box available"></div>
          <span>Available</span>
        </div>
        <div className="legend-item">
          <div className="legend-box booked"></div>
          <span>Booked</span>
        </div>
        <div className="legend-item">
          <div className="legend-box past"></div>
          <span>Past</span>
        </div>
        <div className="legend-item">
          <div className="legend-box selected"></div>
          <span>Selected</span>
        </div>
      </div>

      <div className="timeline">
        {hours.map((hour) => (
          <div key={hour} className="hour-block">
            <div className="hour-label">
              {`${String(hour).padStart(2, '0')}:00-${String(hour + 1).padStart(2, '0')}:00`}
            </div>
            {(() => {
              const slotStartMinutes = hour * 60;
              const slotEndMinutes = (hour + 1) * 60;
              const booked = doesSlotOverlapBooking(slotStartMinutes, slotEndMinutes);
              const past = isPastSlot(hour);
              const isSelected = selectedStartTime === `${String(hour).padStart(2, '0')}:00`;
              const isUnavailable = booked || past;

              return (
                <div
                  className={`time-slot hour-slot ${booked ? 'booked' : 'available'} ${past ? 'past' : ''} ${isSelected ? 'selected' : ''}`}
                  onClick={() => !isUnavailable && handleTimeSlotClick(hour)}
                  title={`${String(hour).padStart(2, '0')}:00 to ${String(hour + 1).padStart(2, '0')}:00`}
                >
                  1 hr
                </div>
              );
            })()}
          </div>
        ))}
      </div>

      <p className="timeline-hint">💡 Click an available future slot to book a fixed 1-hour session (last slot ends at 23:00)</p>
    </div>
  );
}

export default TimelineAvailability;
