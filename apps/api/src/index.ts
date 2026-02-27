import app from './app'
import { startReminderJob } from './services/reminder.job'

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`)
  startReminderJob()
})
