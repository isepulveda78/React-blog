// Temporary script to update user role
import { MongoClient } from 'mongodb';

async function updateUserRole() {
  try {
    console.log('Connecting to MongoDB...');
    const client = new MongoClient('mongodb://localhost:27017/blogcraft');
    await client.connect();
    
    const db = client.db();
    const users = db.collection('users');
    
    // Update the user's role from student to teacher
    const result = await users.updateOne(
      { email: 'sepulveda.israel@yahoo.com' },
      { $set: { role: 'teacher' } }
    );
    
    console.log('Update result:', result);
    
    if (result.modifiedCount === 1) {
      console.log('✅ User role updated successfully from student to teacher');
    } else {
      console.log('❌ No user was updated - user may not exist');
    }
    
    // Verify the update
    const updatedUser = await users.findOne({ email: 'sepulveda.israel@yahoo.com' });
    console.log('Updated user role:', updatedUser?.role);
    
    await client.close();
  } catch (error) {
    console.error('Error updating user role:', error);
  }
}

updateUserRole();