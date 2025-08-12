import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function updateUserPasswords() {
  console.log('Updating existing users with default passwords...');
  
  // Default password for all existing users - should be changed on first login
  const defaultPassword = 'LabSync2025!';
  const hashedPassword = await bcrypt.hash(defaultPassword, 12);
  
  try {
    // Get all users without passwords
    const usersWithoutPasswords = await prisma.user.findMany({
      where: {
        password: null,
      },
    });
    
    console.log(`Found ${usersWithoutPasswords.length} users without passwords`);
    
    // Update each user with the hashed password
    for (const user of usersWithoutPasswords) {
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });
      console.log(`Updated password for: ${user.email}`);
    }
    
    console.log('\n✅ All users have been updated with default passwords');
    console.log('\n⚠️  Default password is: LabSync2025!');
    console.log('⚠️  Please inform users to change their passwords after first login');
    
  } catch (error) {
    console.error('Error updating user passwords:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateUserPasswords()
  .catch((error) => {
    console.error('Failed to update user passwords:', error);
    process.exit(1);
  });