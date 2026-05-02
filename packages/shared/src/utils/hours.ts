import { getDay } from "date-fns"

export const getAvailableTimes = (date: Date | undefined) => {
  if (!date) return []

  const day = getDay(date) // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
  
  // Tuesday is closed
  if (day === 2) return []

  const times = []
  
  // Opening time is always 12:00 MD
  const startHour = 12
  
  // Closing time depends on the day
  // Mon (1), Wed (3), Thu (4): 11:00 PM
  // Fri (5), Sat (6), Sun (0): 12:00 AM
  let endHour = 23
  if (day === 5 || day === 6 || day === 0) {
    endHour = 24
  }

  for (let h = startHour; h < endHour; h++) {
    times.push(`${h}:00`);
    times.push(`${h}:30`);
  }
  
  if (endHour === 23) {
    times.push("23:00");
  } else if (endHour === 24) {
    times.push("00:00"); 
  }

  return Array.from(new Set(times));
}

export const formatTimeDisplay = (time: string) => {
  const [h, m] = time.split(':').map(Number)
  let displayHour = h
  if (h > 12) displayHour = h - 12
  if (h === 0) displayHour = 12
  
  // Specialized MD formatting for noon
  if (h === 12 && m === 0) return "12:00 md"
  if (h === 12 && m > 0) return `12:${m.toString().padStart(2, '0')} pm`
  if (h === 0 && m === 0) return "12:00 mn"
  
  const suffix = h >= 12 ? 'pm' : 'am'
  return `${displayHour}:${m.toString().padStart(2, '0')} ${suffix}`
}

