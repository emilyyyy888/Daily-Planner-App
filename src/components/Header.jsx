import { useState } from 'react'
import { format, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns'
import { enUS } from 'date-fns/locale/en-US'
import DatePicker from './DatePicker'
import './Header.css'

function Header({ view, setView, currentDate, setCurrentDate }) {
  const [showDatePicker, setShowDatePicker] = useState(false)
  const navigateDate = (direction) => {
    if (view === 'day') {
      setCurrentDate(direction === 'next' ? addDays(currentDate, 1) : subDays(currentDate, 1))
    } else if (view === 'week') {
      setCurrentDate(direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1))
    } else if (view === 'month') {
      setCurrentDate(direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1))
    }
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const handleDateSelect = (date) => {
    setCurrentDate(date)
  }

  const handleDateLabelClick = () => {
    setShowDatePicker(!showDatePicker)
  }

  const getDateLabel = () => {
    if (view === 'day') {
      return format(currentDate, 'EEEE, MMMM d, yyyy', { locale: enUS })
    } else if (view === 'week') {
      const weekStart = format(currentDate, 'MMM d', { locale: enUS })
      const weekEnd = format(addDays(currentDate, 6), 'MMM d', { locale: enUS })
      return `${weekStart} - ${weekEnd}`
    } else {
      return format(currentDate, 'MMMM yyyy', { locale: enUS })
    }
  }

  return (
    <header className="header">
      <div className="header-left">
        <h1 className="app-title">✨ Daily Planner</h1>
      </div>
      
      <div className="header-center">
        <button className="nav-btn" onClick={() => navigateDate('prev')}>
          ←
        </button>
        <button className="date-label" onClick={handleDateLabelClick}>
          {getDateLabel()}
        </button>
        <button className="nav-btn" onClick={() => navigateDate('next')}>
          →
        </button>
      </div>
      
      <div className="header-right">
        <button 
          className={`view-btn ${view === 'day' ? 'active' : ''}`}
          onClick={() => setView('day')}
        >
          Day
        </button>
        <button 
          className={`view-btn ${view === 'week' ? 'active' : ''}`}
          onClick={() => setView('week')}
        >
          Week
        </button>
        <button 
          className={`view-btn ${view === 'month' ? 'active' : ''}`}
          onClick={() => setView('month')}
        >
          Month
        </button>
      </div>

      {showDatePicker && (
        <DatePicker
          currentDate={currentDate}
          onSelectDate={handleDateSelect}
          onClose={() => setShowDatePicker(false)}
        />
      )}
    </header>
  )
}

export default Header
