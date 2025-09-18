#!/usr/bin/env node

/**
 * Script to assign all students to a specific teacher
 * Usage: node scripts/assign_students_teacher.js [--dry-run] [--override-existing]
 */

import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const TARGET_TEACHER_EMAIL = 'sepulveda.israel@gmail.com';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/blogcraft';

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const overrideExisting = args.includes('--override-existing');

async function assignStudentsToTeacher() {
  let client;
  
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // Step 1: Find the target teacher
    console.log(`🔍 Looking for teacher with email: ${TARGET_TEACHER_EMAIL}`);
    const teacher = await usersCollection.findOne({
      email: TARGET_TEACHER_EMAIL,
      role: 'teacher',
      approved: true
    });
    
    if (!teacher) {
      console.error(`❌ Teacher not found with email ${TARGET_TEACHER_EMAIL}, or teacher is not approved`);
      process.exit(1);
    }
    
    console.log(`✅ Found teacher: ${teacher.name} (ID: ${teacher.id})`);
    
    // Step 2: Define query for students to update
    let studentQuery;
    if (overrideExisting) {
      studentQuery = { role: 'student' };
      console.log('⚠️  Override mode: Will assign ALL students to this teacher');
    } else {
      studentQuery = {
        role: 'student',
        $or: [
          { teacherId: { $exists: false } },
          { teacherId: null },
          { teacherId: '' }
        ]
      };
      console.log('📝 Safe mode: Will only assign students without existing teacher');
    }
    
    // Step 3: Count students that will be affected
    const studentsToUpdate = await usersCollection.countDocuments(studentQuery);
    console.log(`📊 Found ${studentsToUpdate} students to assign`);
    
    if (studentsToUpdate === 0) {
      console.log('✨ No students need assignment. Exiting.');
      return;
    }
    
    // Step 4: In dry-run mode, just show what would happen
    if (isDryRun) {
      console.log('\n🔍 DRY RUN MODE - No changes will be made');
      console.log(`Would assign ${studentsToUpdate} students to teacher ${teacher.name}`);
      
      // Show a few example students
      const exampleStudents = await usersCollection.find(studentQuery).limit(5).toArray();
      console.log('\nExample students that would be affected:');
      exampleStudents.forEach(student => {
        console.log(`  - ${student.name} (${student.email})`);
      });
      
      return;
    }
    
    // Step 5: Get list of affected students for rollback log
    console.log('📋 Preparing rollback log...');
    const studentsBeforeUpdate = await usersCollection.find(studentQuery, {
      projection: { id: 1, name: 1, email: 1, teacherId: 1 }
    }).toArray();
    
    // Step 6: Perform the update
    console.log(`🚀 Assigning ${studentsToUpdate} students to teacher ${teacher.name}...`);
    
    const updateResult = await usersCollection.updateMany(
      studentQuery,
      { $set: { teacherId: teacher.id } }
    );
    
    console.log(`✅ Successfully updated ${updateResult.modifiedCount} students`);
    
    // Step 7: Create rollback log
    const rollbackData = {
      timestamp: new Date().toISOString(),
      operation: 'assign_students_teacher',
      targetTeacher: {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email
      },
      studentsModified: studentsBeforeUpdate.map(student => ({
        userId: student.id,
        name: student.name,
        email: student.email,
        previousTeacherId: student.teacherId || null
      })),
      totalModified: updateResult.modifiedCount
    };
    
    const rollbackFileName = `rollback_assign_teacher_${Date.now()}.json`;
    const rollbackPath = path.join(__dirname, rollbackFileName);
    
    fs.writeFileSync(rollbackPath, JSON.stringify(rollbackData, null, 2));
    console.log(`📝 Rollback log saved to: ${rollbackPath}`);
    
    // Step 8: Verify the assignment
    const verificationCount = await usersCollection.countDocuments({
      role: 'student',
      teacherId: teacher.id
    });
    
    console.log(`\n✨ Assignment complete!`);
    console.log(`📊 Total students now assigned to ${teacher.name}: ${verificationCount}`);
    
  } catch (error) {
    console.error('❌ Error during assignment:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the script
console.log('🎓 Student-Teacher Assignment Script');
console.log(`Target Teacher: ${TARGET_TEACHER_EMAIL}`);
console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'EXECUTE'}`);
console.log(`Override existing: ${overrideExisting ? 'YES' : 'NO'}`);
console.log('---');

assignStudentsToTeacher().catch(console.error);