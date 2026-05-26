const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database records...');
  
  try {
    await prisma.pointLog.deleteMany({});
    await prisma.employeePayment.deleteMany({});
    await prisma.invoice.deleteMany({});
    await prisma.task.deleteMany({});
    await prisma.contentTask.deleteMany({});
    await prisma.expense.deleteMany({});
    await prisma.client.deleteMany({});
    await prisma.user.deleteMany({});
    console.log('All records cleared successfully.');
  } catch (err) {
    console.error('Error clearing database:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
