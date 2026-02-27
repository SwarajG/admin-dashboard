import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendReminderEmail(
  to: string[],
  reminderTitle: string,
  projectName: string,
  message?: string | null
): Promise<void> {
  const emailContent = `
    <h2>Project Reminder: ${reminderTitle}</h2>
    <p><strong>Project:</strong> ${projectName}</p>
    ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
    <p>This is an automated reminder from Project Tracker.</p>
  `

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'noreply@projecttracker.com',
    to: to.join(', '),
    subject: `Reminder: ${reminderTitle} - ${projectName}`,
    html: emailContent,
  })
}
