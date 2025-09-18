#!/usr/bin/env node

/**
 * Simple verification script to check if students were assigned to the target teacher
 */

import { MongoClient } from 'mongodb';

const TARGET_TEACHER_EMAIL = 'sepulveda.israel@gmail.com';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/blogcraft';

async function verifyAssignment() {
  let client;
  
  try {
    console.log('🔍 Verifying student assignments...');
    
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // Find the target teacher
    const teacher = await usersCollection.findOne({
      email: TARGET_TEACHER_EMAIL,
      role: 'teacher',
      approved: true
    });
    
    if (!teacher) {
      console.error(`❌ Teacher not found with email ${TARGET_TEACHER_EMAIL}`);
      return;
    }
    
    console.log(`✅ Teacher found: ${teacher.name} (ID: ${teacher.id})`);
    
    // Count students assigned to this teacher
    const studentsAssigned = await usersCollection.countDocuments({
      role: 'student',
      teacherId: teacher.id
    });
    
    console.log(`📊 Students assigned to ${teacher.name}: ${studentsAssigned}`);
    
    // Count total students
    const totalStudents = await usersCollection.countDocuments({
      role: 'student'
    });
    
    console.log(`📊 Total students in database: ${totalStudents}`);
    
    // Show percentage
    const percentage = totalStudents > 0 ? ((studentsAssigned / totalStudents) * 100).toFixed(1) : 0;
    console.log(`📈 Assignment coverage: ${percentage}% of students`);
    
    // Show a few examples
    console.log('\n📋 Sample assigned students:');
    const sampleStudents = await usersCollection.find({
      role: 'student',
      teacherId: teacher.id
    }).limit(5).toArray();
    
    sampleStudents.forEach(student => {
      console.log(`  - ${student.name} (${student.email})`);
    });
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

verifyAssignment();