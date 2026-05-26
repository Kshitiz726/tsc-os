import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database records...');
  
  // Order matters for foreign key constraints in some DBs, but for SQLite we can just delete
  // However, it's safer to delete child records first
  
  await prisma.pointLog.deleteMany({});
  await prisma.employeePayment.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.contentTask.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('All records cleared successfully.');
}

main()
  .catch((e) => {
    console.error('Error clearing database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
