const { PrismaClient } = require('@prisma/client');
try {
  const prisma = new PrismaClient({ datasourceUrl: 'file:./dev.db' });
  console.log("OK");
} catch(e) {
  console.error(e.message);
}
