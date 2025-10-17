import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create Super Admin organization first
  const superAdminOrg = await prisma.organization.create({
    data: {
      name: 'Super Admin Organization',
      type: 'System',
      description: 'System-wide super admin organization with full access',
      themeColor: '#FF6B35', // Orange
      // Avoid external placeholder hosts to prevent DNS failures in dev
      logoUrl: null,
    },
  });

  console.log('✅ Created Super Admin Organization');

  // Create Super Admin role
  const superAdminRole = await prisma.role.create({
    data: {
      name: 'Super Admin',
      description: 'System-wide super admin with full access to all organizations',
      permissions: ['*'], // All permissions
      isDefault: false,
      organizationId: superAdminOrg.id,
    },
  });

  // Create Super Admin user
  const superAdminUser = await prisma.user.create({
    data: {
      fullName: 'Super Administrator',
      passwordHash: await bcrypt.hash('superadmin123', 10),
      phoneNumber: '+918547581833',
      photoUrl: 'https://via.placeholder.com/100x100/FF6B35/FFFFFF?text=SA',
      organizationId: superAdminOrg.id,
      roleId: superAdminRole.id,
    },
  });

  console.log('✅ Created Super Admin user: +918547581833 / superadmin123');

  // Create organizations with different theme colors
  const organizations = await Promise.all([
    prisma.organization.create({
      data: {
        name: 'Tech Community Hub',
        type: 'Community',
        description: 'A vibrant tech community for developers and tech enthusiasts',
        themeColor: '#3B82F6', // Blue
        logoUrl: null,
      },
    }),
    prisma.organization.create({
      data: {
        name: 'Green Earth Foundation',
        type: 'Non-Profit',
        description: 'Environmental conservation and sustainability initiatives',
        themeColor: '#10B981', // Green
        logoUrl: null,
      },
    }),
    prisma.organization.create({
      data: {
        name: 'Creative Arts Club',
        type: 'Club',
        description: 'Bringing together artists, musicians, and creative minds',
        themeColor: '#8B5CF6', // Purple
        logoUrl: null,
      },
    }),
  ]);

  console.log(`✅ Created ${organizations.length} organizations`);

  // Create roles for each organization
  for (const org of organizations) {
    const roles = await Promise.all([
      prisma.role.create({
        data: {
          name: 'Admin',
          description: 'Full access to all features',
          permissions: ['members.read', 'members.write', 'roles.read', 'roles.write', 'events.read', 'events.write', 'announcements.read', 'announcements.write', 'elections.read', 'elections.write', 'chats.read', 'chats.write'],
          isDefault: false,
          organizationId: org.id,
        },
      }),
      prisma.role.create({
        data: {
          name: 'Moderator',
          description: 'Can manage events, announcements, and elections',
          permissions: ['members.read', 'events.read', 'events.write', 'announcements.read', 'announcements.write', 'elections.read', 'elections.write', 'chats.read', 'chats.write'],
          isDefault: false,
          organizationId: org.id,
        },
      }),
      prisma.role.create({
        data: {
          name: 'Member',
          description: 'Basic member access',
          permissions: ['members.read', 'events.read', 'announcements.read', 'elections.read', 'chats.read'],
          isDefault: true,
          organizationId: org.id,
        },
      }),
    ]);

    console.log(`✅ Created ${roles.length} roles for ${org.name}`);

    // Create users for each organization with unique phone numbers
    const orgIndex = organizations.indexOf(org);
    
    // Use specific phone numbers for Tech Community Hub (first organization)
    let phoneNumbers;
    if (orgIndex === 0) {
      // Tech Community Hub - use specific phone numbers
      phoneNumbers = ['+917012999572', '+919562929216', '+919562929217', '+919562929218'];
    } else {
      // Other organizations - use generated phone numbers
      const basePhone = 1234567890 + (orgIndex * 10);
      phoneNumbers = [`+1${basePhone}`, `+1${basePhone + 1}`, `+1${basePhone + 2}`, `+1${basePhone + 3}`];
    }
    
    const users = await Promise.all([
      prisma.user.create({
        data: {
          fullName: `${org.name} Admin`,
          passwordHash: await bcrypt.hash('admin123', 10),
          phoneNumber: phoneNumbers[0],
          photoUrl: null,
          organizationId: org.id,
          roleId: roles[0].id, // Admin role
        },
      }),
      prisma.user.create({
        data: {
          fullName: `${org.name} Moderator`,
          passwordHash: await bcrypt.hash('mod123', 10),
          phoneNumber: phoneNumbers[1],
          photoUrl: null,
          organizationId: org.id,
          roleId: roles[1].id, // Moderator role
        },
      }),
      prisma.user.create({
        data: {
          fullName: `John Doe`,
          passwordHash: await bcrypt.hash('member123', 10),
          phoneNumber: phoneNumbers[2],
          photoUrl: null,
          organizationId: org.id,
          roleId: roles[2].id, // Member role
        },
      }),
      prisma.user.create({
        data: {
          fullName: `Jane Smith`,
          passwordHash: await bcrypt.hash('member123', 10),
          phoneNumber: phoneNumbers[3],
          photoUrl: null,
          organizationId: org.id,
          roleId: roles[2].id, // Member role
        },
      }),
    ]);

    console.log(`✅ Created ${users.length} users for ${org.name}`);

    // Create events for each organization with financial data
    const events = await Promise.all([
      prisma.event.create({
        data: {
          title: `${org.name} Monthly Meetup`,
          description: 'Join us for our monthly community gathering with networking, discussions, and fun activities.',
          location: 'Community Center, Main Street',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 3 hours later
          imageUrl: null,
          attendeesCount: 25,
          budget: 1200.00,
          actualCost: 950.00,
          organizerId: users[0].id,
          organizerName: users[0].fullName,
          organizationId: org.id,
        },
      }),
      prisma.event.create({
        data: {
          title: `${org.name} Workshop Series`,
          description: 'Hands-on workshop covering the latest trends and best practices in our field.',
          location: 'Conference Room A, Tech Building',
          startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
          endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // 4 hours later
          imageUrl: null,
          attendeesCount: 15,
          budget: 800.00,
          actualCost: 750.00,
          organizerId: users[1].id,
          organizerName: users[1].fullName,
          organizationId: org.id,
        },
      }),
      prisma.event.create({
        data: {
          title: `${org.name} Annual Conference`,
          description: 'Our biggest event of the year featuring keynote speakers, panel discussions, and networking opportunities.',
          location: 'Grand Convention Center',
          startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 1 month from now
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000), // 8 hours later
          imageUrl: null,
          attendeesCount: 150,
          budget: 5000.00,
          actualCost: 4200.00,
          organizerId: users[0].id,
          organizerName: users[0].fullName,
          organizationId: org.id,
        },
      }),
    ]);

    console.log(`✅ Created ${events.length} events for ${org.name}`);

    // Create announcements for each organization
    const announcements = await Promise.all([
      prisma.announcement.create({
        data: {
          title: 'Welcome to Our Community!',
          content: 'We are excited to have you join our community. Please take a moment to explore our upcoming events and get involved.',
          authorId: users[0].id,
          authorName: users[0].fullName,
          isPinned: true,
          organizationId: org.id,
        },
      }),
      prisma.announcement.create({
        data: {
          title: 'New Member Guidelines',
          content: 'Please review our community guidelines to ensure a positive experience for everyone. We value respect, inclusivity, and collaboration.',
          authorId: users[0].id,
          authorName: users[0].fullName,
          isPinned: false,
          organizationId: org.id,
        },
      }),
      prisma.announcement.create({
        data: {
          title: 'Upcoming Event Reminder',
          content: 'Don\'t forget about our monthly meetup next week! We have some exciting activities planned and look forward to seeing you there.',
          authorId: users[1].id,
          authorName: users[1].fullName,
          isPinned: false,
          organizationId: org.id,
        },
      }),
    ]);

    console.log(`✅ Created ${announcements.length} announcements for ${org.name}`);

    // Create additional events with more variety
    const additionalEvents = await Promise.all([
      prisma.event.create({
        data: {
          title: `${org.name} Tech Talk`,
          description: 'Join us for an exciting tech talk about the latest innovations in our field.',
          location: 'Virtual Meeting Room',
          startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
          endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours later
          imageUrl: null,
          attendeesCount: 50,
          organizerId: users[1].id,
          organizerName: users[1].fullName,
          organizationId: org.id,
        },
      }),
      prisma.event.create({
        data: {
          title: `${org.name} Social Mixer`,
          description: 'A casual social event to meet other community members and network.',
          location: 'Community Lounge',
          startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
          endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 3 hours later
          imageUrl: null,
          attendeesCount: 30,
          organizerId: users[2].id,
          organizerName: users[2].fullName,
          organizationId: org.id,
        },
      }),
    ]);

    console.log(`✅ Created ${additionalEvents.length} additional events for ${org.name}`);

    // Create additional announcements
    const additionalAnnouncements = await Promise.all([
      prisma.announcement.create({
        data: {
          title: 'Community Guidelines Update',
          content: 'We have updated our community guidelines to better serve our growing community. Please review the changes.',
          authorId: users[0].id,
          authorName: users[0].fullName,
          isPinned: true,
          organizationId: org.id,
        },
      }),
      prisma.announcement.create({
        data: {
          title: 'Volunteer Opportunities',
          content: 'We are looking for volunteers to help with our upcoming events. Contact us if you are interested!',
          authorId: users[1].id,
          authorName: users[1].fullName,
          isPinned: false,
          organizationId: org.id,
        },
      }),
      prisma.announcement.create({
        data: {
          title: 'System Maintenance Notice',
          content: 'Our platform will undergo maintenance this weekend. Some features may be temporarily unavailable.',
          authorId: users[0].id,
          authorName: users[0].fullName,
          isPinned: false,
          organizationId: org.id,
        },
      }),
    ]);

    console.log(`✅ Created ${additionalAnnouncements.length} additional announcements for ${org.name}`);

    // Create comprehensive notifications for each user
    for (const user of users) {
      const notifications = await Promise.all([
        // Recent unread notifications
        prisma.notification.create({
          data: {
            title: 'New Member Joined',
            message: 'Sarah Johnson has joined the community',
            type: 'member',
            userId: user.id,
            isRead: false,
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          },
        }),
        prisma.notification.create({
          data: {
            title: 'Event Reminder',
            message: `${org.name} Monthly Meetup starts in 1 hour`,
            type: 'event',
            userId: user.id,
            isRead: false,
            createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
          },
        }),
        prisma.notification.create({
          data: {
            title: 'New Announcement',
            message: 'Community Guidelines Update - Please review',
            type: 'announcement',
            userId: user.id,
            isRead: false,
            createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          },
        }),
        prisma.notification.create({
          data: {
            title: 'Event Created',
            message: `${org.name} Tech Talk has been scheduled`,
            type: 'event',
            userId: user.id,
            isRead: false,
            createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
          },
        }),
        prisma.notification.create({
          data: {
            title: 'Election Update',
            message: 'Voting closes in 3 days for Board Member Election',
            type: 'election',
            userId: user.id,
            isRead: false,
            createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
          },
        }),
        
        // Older read notifications
        prisma.notification.create({
          data: {
            title: 'Security Update',
            message: 'New security measures implemented',
            type: 'security',
            userId: user.id,
            isRead: true,
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          },
        }),
        prisma.notification.create({
          data: {
            title: 'Meeting Scheduled',
            message: 'Finance Committee meeting added to calendar',
            type: 'meeting',
            userId: user.id,
            isRead: true,
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          },
        }),
        prisma.notification.create({
          data: {
            title: 'Role Assignment',
            message: 'You\'ve been assigned as Event Coordinator',
            type: 'role',
            userId: user.id,
            isRead: true,
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          },
        }),
        prisma.notification.create({
          data: {
            title: 'Event Cancelled',
            message: 'Workshop Series has been cancelled due to weather',
            type: 'event',
            userId: user.id,
            isRead: true,
            createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
          },
        }),
        prisma.notification.create({
          data: {
            title: 'New Announcement',
            message: 'Volunteer Opportunities Available',
            type: 'announcement',
            userId: user.id,
            isRead: true,
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          },
        }),
        prisma.notification.create({
          data: {
            title: 'Member Activity',
            message: 'John Doe updated their profile',
            type: 'member',
            userId: user.id,
            isRead: true,
            createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
          },
        }),
        prisma.notification.create({
          data: {
            title: 'System Maintenance',
            message: 'Platform maintenance completed successfully',
            type: 'announcement',
            userId: user.id,
            isRead: true,
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          },
        }),
      ]);

      console.log(`✅ Created ${notifications.length} notifications for ${user.fullName}`);
    }
  }

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📋 Test Accounts Created:');
  console.log('\n🔑 SUPER ADMIN:');
  console.log('  Super Admin: +918547581833 / superadmin123');
  console.log('  (Orange theme - Full system access)');
  console.log('\nTech Community Hub:');
  console.log('  Admin: +917012999572 / admin123');
  console.log('  Moderator: +919562929216 / mod123');
  console.log('  Member: +919562929217 / member123');
  console.log('  Member: +919562929218 / member123');
  console.log('\nGreen Earth Foundation:');
  console.log('  Admin: +11234567900 / admin123');
  console.log('  Moderator: +11234567901 / mod123');
  console.log('  Member: +11234567902 / member123');
  console.log('\nCreative Arts Club:');
  console.log('  Admin: +11234567910 / admin123');
  console.log('  Moderator: +11234567911 / mod123');
  console.log('  Member: +11234567912 / member123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
