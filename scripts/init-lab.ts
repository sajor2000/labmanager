import { prisma } from '../lib/prisma';

async function initLab() {
  try {
    console.log('Checking for existing labs...');
    
    // Check if any labs exist
    const existingLabs = await prisma.lab.findMany();
    
    if (existingLabs.length === 0) {
      console.log('No labs found. Creating default lab...');
      
      // Create a default lab
      const lab = await prisma.lab.create({
        data: {
          name: 'Health Equity Labs',
          shortName: 'HEL',
          description: 'Research laboratory focused on health equity and disparities',
          isActive: true,
        },
      });
      
      console.log('✅ Default lab created:', lab);
      
      // Check for existing users
      const users = await prisma.user.findMany();
      
      if (users.length > 0) {
        console.log(`Found ${users.length} existing users. Adding them to the lab...`);
        
        // Add all existing users to the lab
        for (const user of users) {
          await prisma.labMember.create({
            data: {
              userId: user.id,
              labId: lab.id,
              isAdmin: user.role === 'PRINCIPAL_INVESTIGATOR' || user.role === 'LAB_ADMINISTRATOR',
            },
          }).catch(() => {
            // Ignore if already exists
          });
        }
        
        console.log('✅ Users added to lab');
      }
      
      // Create default buckets for the lab
      const defaultBuckets = [
        { name: 'Abbott', color: '#00BCD4', position: 0 },
        { name: 'Wisconsin R01', color: '#E91E63', position: 1 },
        { name: 'Pilot Studies', color: '#9C27B0', position: 2 },
        { name: 'Industry Sponsored', color: '#FF9800', position: 3 },
      ];
      
      for (const bucketData of defaultBuckets) {
        await prisma.bucket.create({
          data: {
            ...bucketData,
            labId: lab.id,
          },
        }).catch(() => {
          // Ignore if already exists
        });
      }
      
      console.log('✅ Default buckets created');
      
      return lab;
    } else {
      console.log(`Found ${existingLabs.length} existing lab(s):`);
      existingLabs.forEach(lab => {
        console.log(`- ${lab.name} (${lab.shortName}) - ID: ${lab.id}`);
      });
      return existingLabs[0];
    }
  } catch (error) {
    console.error('Error initializing lab:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the initialization
initLab()
  .then(lab => {
    console.log('\n✅ Lab initialization complete!');
    console.log('Lab ID to use:', lab.id);
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Lab initialization failed:', error);
    process.exit(1);
  });