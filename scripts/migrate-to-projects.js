const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateToProjects() {
  console.log('🚀 Starting migration to project-based structure...');
  
  try {
    // Step 1: Get all existing users
    console.log('📋 Step 1: Fetching existing users...');
    const users = await prisma.user.findMany({
      include: {
        events: true,
        persons: true,
        life_events: true,
        literature: true,
        event_types: true,
        importHistory: true,
        dataUncertainty: true,
        duplicateMatches: true
      }
    });
    
    console.log(`Found ${users.length} users to migrate`);
    
    // Step 2: Create default projects for each user
    console.log('📋 Step 2: Creating default projects for users...');
    const projectPromises = users.map(async (user) => {
      // Check if user already has a default project
      const existingProject = await prisma.project.findFirst({
        where: {
          owner_id: user.id,
          name: 'Default Project'
        }
      });
      
      if (existingProject) {
        console.log(`User ${user.email} already has a default project`);
        return existingProject;
      }
      
      // Create default project
      const project = await prisma.project.create({
        data: {
          name: 'Default Project',
          description: 'Default project for existing data',
          owner_id: user.id,
          updated_at: new Date()
        }
      });
      
      console.log(`Created default project for user ${user.email}`);
      return project;
    });
    
    const projects = await Promise.all(projectPromises);
    console.log(`Created/verified ${projects.length} default projects`);
    
    // Step 3: Migrate existing data to projects
    console.log('📋 Step 3: Migrating existing data to projects...');
    
    for (const user of users) {
      const userProject = projects.find(p => p.owner_id === user.id);
      if (!userProject) {
        console.log(`⚠️  No project found for user ${user.email}, skipping...`);
        continue;
      }
      
      console.log(`Migrating data for user ${user.email}...`);
      
      // Migrate events
      if (user.events.length > 0) {
        await prisma.events.updateMany({
          where: { userId: user.id, project_id: null },
          data: { project_id: userProject.id }
        });
        console.log(`  - Migrated ${user.events.length} events`);
      }
      
      // Migrate persons
      if (user.persons.length > 0) {
        await prisma.persons.updateMany({
          where: { userId: user.id, project_id: null },
          data: { project_id: userProject.id }
        });
        console.log(`  - Migrated ${user.persons.length} persons`);
      }
      
      // Migrate life events
      if (user.life_events.length > 0) {
        await prisma.life_events.updateMany({
          where: { userId: user.id, project_id: null },
          data: { project_id: userProject.id }
        });
        console.log(`  - Migrated ${user.life_events.length} life events`);
      }
      
      // Migrate literature
      if (user.literature.length > 0) {
        await prisma.literature.updateMany({
          where: { userId: user.id, project_id: null },
          data: { project_id: userProject.id }
        });
        console.log(`  - Migrated ${user.literature.length} literature entries`);
      }
      
      // Migrate event types
      if (user.event_types.length > 0) {
        await prisma.event_types.updateMany({
          where: { userId: user.id, project_id: null },
          data: { project_id: userProject.id }
        });
        console.log(`  - Migrated ${user.event_types.length} event types`);
      }
      
      // Migrate import history
      if (user.importHistory.length > 0) {
        await prisma.import_history.updateMany({
          where: { userId: user.id, project_id: null },
          data: { project_id: userProject.id }
        });
        console.log(`  - Migrated ${user.importHistory.length} import history entries`);
      }
      
      // Migrate data uncertainty
      if (user.dataUncertainty.length > 0) {
        await prisma.data_uncertainty.updateMany({
          where: { userId: user.id, project_id: null },
          data: { project_id: userProject.id }
        });
        console.log(`  - Migrated ${user.dataUncertainty.length} data uncertainty entries`);
      }
      
      // Migrate duplicate matches
      if (user.duplicateMatches.length > 0) {
        await prisma.duplicate_matches.updateMany({
          where: { userId: user.id, project_id: null },
          data: { project_id: userProject.id }
        });
        console.log(`  - Migrated ${user.duplicateMatches.length} duplicate match entries`);
      }
    }
    
    // Step 4: Add users to their default projects as members
    console.log('📋 Step 4: Adding users to their default projects...');
    const memberPromises = users.map(async (user) => {
      const userProject = projects.find(p => p.owner_id === user.id);
      if (!userProject) return;
      
      // Check if user is already a member
      const existingMember = await prisma.userProject.findFirst({
        where: {
          user_id: user.id,
          project_id: userProject.id
        }
      });
      
      if (existingMember) {
        console.log(`User ${user.email} is already a member of their default project`);
        return;
      }
      
      // Add user as member
      await prisma.userProject.create({
        data: {
          user_id: user.id,
          project_id: userProject.id,
          role: 'owner'
        }
      });
      
      console.log(`Added user ${user.email} as owner to their default project`);
    });
    
    await Promise.all(memberPromises);
    
    // Step 5: Verify migration
    console.log('📋 Step 5: Verifying migration...');
    const verificationResults = await Promise.all(users.map(async (user) => {
      const userProject = projects.find(p => p.owner_id === user.id);
      if (!userProject) return { user: user.email, status: 'no_project' };
      
      const [eventsCount, personsCount, lifeEventsCount, literatureCount] = await Promise.all([
        prisma.events.count({ where: { userId: user.id, project_id: userProject.id } }),
        prisma.persons.count({ where: { userId: user.id, project_id: userProject.id } }),
        prisma.life_events.count({ where: { userId: user.id, project_id: userProject.id } }),
        prisma.literature.count({ where: { userId: user.id, project_id: userProject.id } })
      ]);
      
      return {
        user: user.email,
        project: userProject.name,
        events: eventsCount,
        persons: personsCount,
        lifeEvents: lifeEventsCount,
        literature: literatureCount
      };
    }));
    
    console.log('\n📊 Migration Summary:');
    verificationResults.forEach(result => {
      if (result.status === 'no_project') {
        console.log(`❌ ${result.user}: No project found`);
      } else {
        console.log(`✅ ${result.user}: ${result.events} events, ${result.persons} persons, ${result.lifeEvents} life events, ${result.literature} literature`);
      }
    });
    
    console.log('\n🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateToProjects()
    .then(() => {
      console.log('✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateToProjects }; 