import cron from 'node-cron'
import { prisma } from '@repo/db'
import { sendReminderEmail } from './email.service'

export function startReminderJob(): void {
  if (process.env.NODE_ENV === 'test') return

  // Run every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    try {
      const now = new Date()
      const pendingReminders = await prisma.reminder.findMany({
        where: {
          remindAt: { lte: now },
          isSent: false,
        },
        include: {
          project: {
            include: {
              members: {
                include: { user: true },
              },
              owner: true,
            },
          },
          createdBy: true,
        },
      })

      for (const reminder of pendingReminders) {
        const memberEmails = reminder.project.members.map((m) => m.user.email)
        const ownerEmail = reminder.project.owner.email
        const recipients = [...new Set([ownerEmail, ...memberEmails])]

        try {
          await sendReminderEmail(
            recipients,
            reminder.title,
            reminder.project.name,
            reminder.message
          )
          await prisma.reminder.update({
            where: { id: reminder.id },
            data: { isSent: true },
          })
        } catch (emailError) {
          console.error(`Failed to send reminder ${reminder.id}:`, emailError)
        }
      }
    } catch (error) {
      console.error('Reminder job error:', error)
    }
  })

  console.log('Reminder job started (runs every 15 minutes)')
}
