import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // --- Users ---

  const adminPassword = await bcrypt.hash('admin123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  })

  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      name: 'Alice Manager',
      email: 'alice@example.com',
      role: 'MANAGER',
    },
  })

  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      name: 'Bob Manager',
      email: 'bob@example.com',
      role: 'MANAGER',
    },
  })

  const charlie = await prisma.user.upsert({
    where: { email: 'charlie@example.com' },
    update: {},
    create: {
      name: 'Charlie Employee',
      email: 'charlie@example.com',
      role: 'EMPLOYEE',
    },
  })

  const dana = await prisma.user.upsert({
    where: { email: 'dana@example.com' },
    update: {},
    create: {
      name: 'Dana Employee',
      email: 'dana@example.com',
      role: 'EMPLOYEE',
    },
  })

  await prisma.user.upsert({
    where: { email: 'eve@example.com' },
    update: {},
    create: {
      name: 'Eve Viewer',
      email: 'eve@example.com',
      role: 'VIEWER',
    },
  })

  console.log(`Created users: ${admin.email}, ${alice.email}, ${bob.email}, ${charlie.email}, ${dana.email}`)

  // --- Project 1: Website Redesign ---

  const now = new Date()

  const deadline1 = new Date(now)
  deadline1.setDate(deadline1.getDate() + 30)

  const project1 = await prisma.project.upsert({
    where: { id: 'seed-project-website-redesign' },
    update: {},
    create: {
      id: 'seed-project-website-redesign',
      name: 'Website Redesign',
      status: 'ACTIVE',
      deadline: deadline1,
      ownerId: alice.id,
    },
  })

  // Members: Charlie and Dana
  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project1.id, userId: charlie.id } },
    update: {},
    create: {
      projectId: project1.id,
      userId: charlie.id,
    },
  })

  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project1.id, userId: dana.id } },
    update: {},
    create: {
      projectId: project1.id,
      userId: dana.id,
    },
  })

  // Reminder: "Review designs", remindAt: 7 days from now
  const remindAt1 = new Date(now)
  remindAt1.setDate(remindAt1.getDate() + 7)

  await prisma.reminder.upsert({
    where: { id: 'seed-reminder-review-designs' },
    update: {},
    create: {
      id: 'seed-reminder-review-designs',
      projectId: project1.id,
      createdById: alice.id,
      title: 'Review designs',
      remindAt: remindAt1,
    },
  })

  // Blocker: "Missing assets", status: OPEN
  await prisma.blocker.upsert({
    where: { id: 'seed-blocker-missing-assets' },
    update: {},
    create: {
      id: 'seed-blocker-missing-assets',
      projectId: project1.id,
      reportedById: alice.id,
      title: 'Missing assets',
      status: 'OPEN',
    },
  })

  console.log(`Created project: ${project1.name}`)

  // --- Project 2: Mobile App Launch ---

  const deadline2 = new Date(now)
  deadline2.setDate(deadline2.getDate() + 60)

  const project2 = await prisma.project.upsert({
    where: { id: 'seed-project-mobile-app-launch' },
    update: {},
    create: {
      id: 'seed-project-mobile-app-launch',
      name: 'Mobile App Launch',
      status: 'NOT_STARTED',
      deadline: deadline2,
      ownerId: bob.id,
    },
  })

  // Members: Charlie
  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project2.id, userId: charlie.id } },
    update: {},
    create: {
      projectId: project2.id,
      userId: charlie.id,
    },
  })

  // Reminder: "Kickoff meeting", remindAt: 3 days from now
  const remindAt2 = new Date(now)
  remindAt2.setDate(remindAt2.getDate() + 3)

  await prisma.reminder.upsert({
    where: { id: 'seed-reminder-kickoff-meeting' },
    update: {},
    create: {
      id: 'seed-reminder-kickoff-meeting',
      projectId: project2.id,
      createdById: bob.id,
      title: 'Kickoff meeting',
      remindAt: remindAt2,
    },
  })

  // Blocker: "API dependencies not ready", status: OPEN
  await prisma.blocker.upsert({
    where: { id: 'seed-blocker-api-dependencies' },
    update: {},
    create: {
      id: 'seed-blocker-api-dependencies',
      projectId: project2.id,
      reportedById: bob.id,
      title: 'API dependencies not ready',
      status: 'OPEN',
    },
  })

  console.log(`Created project: ${project2.name}`)
  console.log('Database seeded successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
