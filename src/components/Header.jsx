import { useState } from 'react'
import { format, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns'
import { enUS } from 'date-fns/locale/en-US'
import DatePicker from './DatePicker'
import { checkLocalStorage, exportData, importData } from '../utils/storageDebug'
import './Header.css'

function Header({ view, setView, currentDate, setCurrentDate }) {
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showStorageInfo, setShowStorageInfo] = useState(false)
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

  const handleCheckStorage = () => {
    const result = checkLocalStorage()
    const message = `
Storage Status:
✅ Available: ${result.available ? 'Yes' : 'No'}
📝 Draft Tasks: ${result.draftTasks ? result.draftTasks.length : 0} tasks
📅 Scheduled Tasks: ${result.scheduledTasks ? Object.values(result.scheduledTasks).reduce((sum, tasks) => sum + tasks.length, 0) : 0} tasks
${result.error ? `❌ Error: ${result.error}` : ''}

Check browser console (F12) for detailed logs.
    `
    alert(message)
    console.log('Storage check result:', result)
  }

  const handleExportData = () => {
    if (exportData()) {
      alert('✅ Data exported successfully!')
    } else {
      alert('❌ Failed to export data. Check console for details.')
    }
  }

  const handleImportData = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (file) {
        try {
          await importData(file)
          alert('✅ Data imported successfully! Please refresh the page.')
          window.location.reload()
        } catch (error) {
          alert('❌ Failed to import data: ' + error.message)
        }
      }
    }
    input.click()
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
        <button 
          className="view-btn storage-btn"
          onClick={() => setShowStorageInfo(!showStorageInfo)}
          title="Storage Tools"
        >
          💾
        </button>
      </div>
      
      {showStorageInfo && (
        <div className="storage-menu">
          <button onClick={handleCheckStorage}>Check Storage</button>
          <button onClick={handleExportData}>Export Data</button>
          <button onClick={handleImportData}>Import Data</button>
        </div>
      )}

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
