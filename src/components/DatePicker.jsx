import { useState, useEffect, useRef } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns'
import { enUS } from 'date-fns/locale/en-US'
import './DatePicker.css'

function DatePicker({ currentDate, onSelectDate, onClose }) {
  const [displayMonth, setDisplayMonth] = useState(currentDate)
  const pickerRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside date picker and not on date label button
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        const dateLabel = event.target.closest('.date-label')
        if (!dateLabel) {
          onClose()
        }
      }
    }

    // Use setTimeout to ensure event handling executes after Header's click event
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 0)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])

  const monthStart = startOfMonth(displayMonth)
  const monthEnd = endOfMonth(displayMonth)
  const calendarStart = startOfWeek(monthStart, { locale: enUS })
  const calendarEnd = endOfWeek(monthEnd, { locale: enUS })

  const days = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  })

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const handleDateClick = (day) => {
    onSelectDate(day)
    onClose()
  }

  const handlePrevMonth = () => {
    setDisplayMonth(subMonths(displayMonth, 1))
  }

  const handleNextMonth = () => {
    setDisplayMonth(addMonths(displayMonth, 1))
  }

  const handleToday = () => {
    const today = new Date()
    setDisplayMonth(today)
    handleDateClick(today)
  }

  return (
    <div className="date-picker-overlay">
      <div className="date-picker" ref={pickerRef}>
        <button className="date-picker-close-btn" onClick={onClose} title="Close"></button>
        <div className="date-picker-header">
          <button className="date-picker-nav-btn" onClick={handlePrevMonth}>
            ←
          </button>
          <div className="date-picker-month">
            {format(displayMonth, 'MMMM yyyy', { locale: enUS })}
          </div>
          <button className="date-picker-nav-btn" onClick={handleNextMonth}>
            →
          </button>
        </div>

        <div className="date-picker-weekdays">
          {weekDays.map(day => (
            <div key={day} className="date-picker-weekday">
              {day}
            </div>
          ))}
        </div>

        <div className="date-picker-days">
          {days.map(day => {
            const isCurrentMonth = isSameMonth(day, displayMonth)
            const isSelected = isSameDay(day, currentDate)
            const isTodayDate = isToday(day)

            return (
              <button
                key={day.toISOString()}
                className={`date-picker-day ${!isCurrentMonth ? 'other-month' : ''} ${isSelected ? 'selected' : ''} ${isTodayDate ? 'today' : ''}`}
                onClick={() => handleDateClick(day)}
              >
                {format(day, 'd')}
              </button>
            )
          })}
        </div>

        <div className="date-picker-footer">
          <button className="date-picker-today-btn" onClick={handleToday}>
            Today
          </button>
        </div>
      </div>
    </div>
  )
}

export default DatePicker

