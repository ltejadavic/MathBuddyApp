import { PrismaClient, Role } from '@prisma/client';
import process from 'process';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  // Clean existing data for idempotency in dev
  console.log('Cleaning existing data...');
  // Delete in reverse dependency order
  await prisma.resource.deleteMany();
  await prisma.classSummary.deleteMany();
  await prisma.progressRecord.deleteMany();
  await prisma.assessmentResult.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.assignmentSubmission.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.chatParticipant.deleteMany();
  await prisma.chatThread.deleteMany();
  await prisma.teacherEarning.deleteMany();
  await prisma.hourTransaction.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.classAttendance.deleteMany();
  await prisma.classSession.deleteMany();
  await prisma.teacherAvailability.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.teacherCourse.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.course.deleteMany();
  await prisma.program.deleteMany();
  await prisma.studentGuardian.deleteMany();
  await prisma.guardianProfile.deleteMany();
  await prisma.teacherProfile.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = '$2b$10$Tc66hUxy/Xr0xjTPnjvbL.UQ4GH9yIdXkb7NMV6Y3vTnD/ghi9tf.'; // Admin123!

  console.log('Creating Admin...');
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@mathbuddy.com',
      passwordHash,
      role: Role.ADMIN,
      firstName: 'Super',
      lastName: 'Admin',
    },
  });

  console.log('Creating Teachers...');
  const teacherUsers = [];
  const teacherProfiles = [];
  for (let i = 1; i <= 3; i++) {
    const user = await prisma.user.create({
      data: {
        email: `teacher${i}@mathbuddy.com`,
        passwordHash,
        role: Role.TEACHER,
        firstName: `Teacher`,
        lastName: `Name${i}`,
        teacherProfile: {
          create: {
            hourlyRateCents: 3500 + (i * 500),
            currency: "USD",
            bio: `Experienced teacher number ${i}`,
          }
        }
      },
      include: { teacherProfile: true }
    });
    teacherUsers.push(user);
    if(user.teacherProfile) teacherProfiles.push(user.teacherProfile);
  }

  // Create default teacher matching the old seed email
  const teacherDefault = await prisma.user.create({
    data: {
      email: 'teacher@mathbuddy.com',
      passwordHash,
      role: Role.TEACHER,
      firstName: 'Default',
      lastName: 'Teacher',
      teacherProfile: {
        create: {
          hourlyRateCents: 4000,
          currency: "USD",
          bio: 'Default teacher',
        }
      }
    },
    include: { teacherProfile: true }
  });
  if(teacherDefault.teacherProfile) teacherProfiles.push(teacherDefault.teacherProfile);

  console.log('Creating Students...');
  const studentUsers = [];
  const studentProfiles = [];
  for (let i = 1; i <= 10; i++) {
    const user = await prisma.user.create({
      data: {
        email: `student${i}@mathbuddy.com`,
        passwordHash,
        role: Role.STUDENT,
        firstName: `Student`,
        lastName: `Name${i}`,
        timezone: i % 2 === 0 ? "America/New_York" : "America/Lima",
        studentProfile: {
          create: {
            school: `High School ${i}`,
            gradeLevel: `Grade ${10 + (i % 3)}`,
            remainingMinutes: 600 + (i * 120), // 10 to 30 hours
          }
        }
      },
      include: { studentProfile: true }
    });
    studentUsers.push(user);
    if(user.studentProfile) studentProfiles.push(user.studentProfile);
  }

  const studentDefault = await prisma.user.create({
    data: {
      email: 'student@mathbuddy.com',
      passwordHash,
      role: Role.STUDENT,
      firstName: 'Default',
      lastName: 'Student',
      timezone: "America/New_York",
      studentProfile: {
        create: {
          school: 'Default High School',
          gradeLevel: 'Grade 11',
          remainingMinutes: 1200, 
        }
      }
    },
    include: { studentProfile: true }
  });
  if(studentDefault.studentProfile) studentProfiles.push(studentDefault.studentProfile);

  console.log('Creating Guardians...');
  const guardianUsers = [];
  for (let i = 1; i <= 3; i++) {
    const user = await prisma.user.create({
      data: {
        email: `guardian${i}@mathbuddy.com`,
        passwordHash,
        role: Role.GUARDIAN,
        firstName: `Guardian`,
        lastName: `Name${i}`,
        guardianProfile: {
          create: {
            phoneNumber: `+1555000000${i}`,
          }
        }
      },
      include: { guardianProfile: true }
    });
    guardianUsers.push(user);
    
    // Link Guardian to a couple of students
    if (user.guardianProfile) {
      await prisma.studentGuardian.create({
        data: {
          studentId: studentProfiles[i-1].id,
          guardianId: user.guardianProfile.id,
          relationshipType: "Parent",
          isPrimaryBilling: true,
        }
      });
    }
  }

  console.log('Creating Academic Setup...');
  const satProgram = await prisma.program.create({
    data: { name: "SAT Preparation", description: "Standardized test prep for SAT" }
  });
  const ibProgram = await prisma.program.create({
    data: { name: "IB Diploma", description: "International Baccalaureate Math & Science" }
  });

  const satMath = await prisma.course.create({
    data: { programId: satProgram.id, name: "SAT Math", description: "Math section of the SAT" }
  });
  const satReading = await prisma.course.create({
    data: { programId: satProgram.id, name: "SAT Reading & Writing", description: "RW section of the SAT" }
  });
  
  const ibMath = await prisma.course.create({
    data: { programId: ibProgram.id, name: "IB Math AA HL", description: "Analysis and Approaches Higher Level" }
  });

  console.log('Creating Teacher-Course relations...');
  await prisma.teacherCourse.create({ data: { teacherId: teacherProfiles[0].id, courseId: satMath.id } });
  await prisma.teacherCourse.create({ data: { teacherId: teacherProfiles[0].id, courseId: ibMath.id } });
  await prisma.teacherCourse.create({ data: { teacherId: teacherProfiles[1].id, courseId: satReading.id } });
  await prisma.teacherCourse.create({ data: { teacherId: teacherProfiles[2].id, courseId: satMath.id } });
  
  // Assign default teacher to all courses
  await prisma.teacherCourse.create({ data: { teacherId: teacherProfiles[teacherProfiles.length - 1].id, courseId: satMath.id } });
  await prisma.teacherCourse.create({ data: { teacherId: teacherProfiles[teacherProfiles.length - 1].id, courseId: satReading.id } });

  console.log('Creating Classes...');
  const now = new Date();
  const defaultTeacherId = teacherProfiles[teacherProfiles.length - 1].id;
  const defaultStudentId = studentProfiles[studentProfiles.length - 1].id;
  
  // Past Class (Completed)
  const pastSession = await prisma.classSession.create({
    data: {
      courseId: satMath.id,
      teacherId: defaultTeacherId,
      scheduledStartTime: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 day ago
      scheduledEndTime: new Date(now.getTime() - 22.5 * 60 * 60 * 1000), // 1.5h
      actualStartTime: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      actualEndTime: new Date(now.getTime() - 22.5 * 60 * 60 * 1000),
      status: "COMPLETED",
      meetingLink: "https://zoom.us/j/123456789",
      notes: "Student struggled with algebra, needs more practice."
    }
  });

  await prisma.classAttendance.create({
    data: {
      classSessionId: pastSession.id,
      studentId: defaultStudentId,
      status: "PRESENT"
    }
  });
  
  // Future Class (Scheduled)
  const futureSession = await prisma.classSession.create({
    data: {
      courseId: satMath.id,
      teacherId: defaultTeacherId,
      scheduledStartTime: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 1 day future
      scheduledEndTime: new Date(now.getTime() + 25.5 * 60 * 60 * 1000), // 1.5h
      status: "SCHEDULED",
      meetingLink: "https://zoom.us/j/987654321",
    }
  });

  await prisma.classAttendance.create({
    data: {
      classSessionId: futureSession.id,
      studentId: defaultStudentId,
      status: "EXPECTED"
    }
  });

  console.log('Database seeded successfully!');
  console.log('Credentials:');
  console.log('- admin@mathbuddy.com');
  console.log('- teacher@mathbuddy.com');
  console.log('- student@mathbuddy.com');
  console.log('- Password for all: Admin123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
