import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🏭 Production database initialization...');
  
  try {
    // Check if database is already initialized
    const labCount = await prisma.lab.count();
    const userCount = await prisma.user.count();
    
    if (labCount > 0 || userCount > 0) {
      console.log('✅ Database already contains data:');
      console.log(`   - ${labCount} labs`);
      console.log(`   - ${userCount} users`);
      console.log('   Skipping initialization to preserve existing data.');
      return;
    }
    
    console.log('📝 Empty database detected.');
    console.log('   Please use the application interface to:');
    console.log('   1. Create your first lab');
    console.log('   2. Add team members');
    console.log('   3. Set up project buckets');
    console.log('   4. Create your first research project');
    console.log('');
    console.log('   Or import existing data using your preferred method.');
    
  } catch (error) {
    console.error('❌ Error checking database status:', error);
    throw error;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('✅ Production database ready');
  })
  .catch(async (e) => {
    console.error('❌ Production database initialization failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });