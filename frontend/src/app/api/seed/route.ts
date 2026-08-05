import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    // Clear existing data
    await prisma.notification.deleteMany();
    await prisma.maintenanceTicket.deleteMany();
    await prisma.room.deleteMany();

    // Create Initial Rooms
    const rooms = await Promise.all([
      prisma.room.create({
        data: {
          id: 'rm-101',
          roomNumber: '101',
          roomType: 'King Suite',
          floor: 1,
          building: 'Main Building',
          status: 'DIRTY',
          priority: 'HIGH',
          checkoutTime: '10:30 AM',
          guestCheckoutInfo: 'Guest Checked Out (2 Adults) - Express Checkout',
          housekeeperName: 'Maria Rodriguez',
        },
      }),
      prisma.room.create({
        data: {
          id: 'rm-102',
          roomNumber: '102',
          roomType: 'Double Queen',
          floor: 1,
          building: 'Main Building',
          status: 'CLEANING_IN_PROGRESS',
          priority: 'HIGH',
          checkoutTime: '11:00 AM',
          guestCheckoutInfo: 'Checked out - VIP Customer',
          housekeeperName: 'Maria Rodriguez',
          cleaningStartTime: new Date(Date.now() - 14 * 60 * 1000),
        },
      }),
      prisma.room.create({
        data: {
          id: 'rm-103',
          roomNumber: '103',
          roomType: 'Double Queen',
          floor: 1,
          building: 'Main Building',
          status: 'CLEAN',
          priority: 'MEDIUM',
          lastCleanedAt: '09:45 AM',
          housekeeperName: 'David Chen',
          inspectedBy: 'Sarah Connor',
        },
      }),
      prisma.room.create({
        data: {
          id: 'rm-104',
          roomNumber: '104',
          roomType: 'Deluxe King',
          floor: 1,
          building: 'Main Building',
          status: 'MAINTENANCE_PENDING',
          priority: 'URGENT',
          checkoutTime: '08:15 AM',
          guestCheckoutInfo: 'Reported leaking AC',
        },
      }),
      prisma.room.create({
        data: {
          id: 'rm-201',
          roomNumber: '201',
          roomType: 'Executive Suite',
          floor: 2,
          building: 'Annex Building',
          status: 'DIRTY',
          priority: 'URGENT',
          checkoutTime: '11:30 AM',
          guestCheckoutInfo: 'Arrival expected at 2:00 PM',
          housekeeperName: 'David Chen',
        },
      }),
      prisma.room.create({
        data: {
          id: 'rm-202',
          roomNumber: '202',
          roomType: 'King Suite',
          floor: 2,
          building: 'Annex Building',
          status: 'INSPECTION_PENDING',
          priority: 'MEDIUM',
          cleaningDurationMinutes: 28,
          housekeeperName: 'Maria Rodriguez',
        },
      }),
      prisma.room.create({
        data: {
          id: 'rm-203',
          roomNumber: '203',
          roomType: 'Double Queen',
          floor: 2,
          building: 'Annex Building',
          status: 'CLEAN',
          priority: 'LOW',
          lastCleanedAt: '08:30 AM',
        },
      }),
      prisma.room.create({
        data: {
          id: 'rm-204',
          roomNumber: '204',
          roomType: 'Single Queen',
          floor: 2,
          building: 'Annex Building',
          status: 'OUT_OF_SERVICE',
          priority: 'LOW',
        },
      }),
    ]);

    // Create Initial Tickets
    const ticket1 = await prisma.maintenanceTicket.create({
      data: {
        id: 'tkt-101',
        ticketNumber: 'TKT-2026-001',
        roomId: 'rm-104',
        roomNumber: '104',
        category: 'HVAC',
        title: 'AC unit leaking water onto carpet',
        description: 'The split AC unit in Room 104 is dripping water onto the bedside carpet continuously when cooling.',
        priority: 'URGENT',
        status: 'OPEN',
        reporterName: 'Maria Rodriguez',
        reporterRole: 'HOUSEKEEPER',
        images: JSON.stringify(['https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80']),
        smsSentToTech: true,
      },
    });

    const ticket2 = await prisma.maintenanceTicket.create({
      data: {
        id: 'tkt-102',
        ticketNumber: 'TKT-2026-002',
        roomId: 'rm-204',
        roomNumber: '204',
        category: 'PLUMBING',
        title: 'Bathroom sink flush drain clogged',
        description: 'Water drains very slowly. Needs snake pipe cleanout.',
        priority: 'MEDIUM',
        status: 'IN_PROGRESS',
        reporterName: 'David Chen',
        reporterRole: 'HOUSEKEEPER',
        assignedTechId: 'tech-1',
        assignedTechName: 'Alex Rivera (Plumbing Specialist)',
        images: JSON.stringify(['https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&auto=format&fit=crop&q=80']),
        startedAt: new Date(Date.now() - 30 * 60 * 1000),
        estimatedCompletionTime: '2:30 PM',
      },
    });

    // Create Initial Notifications
    await prisma.notification.createMany({
      data: [
        {
          id: 'notif-1',
          title: 'Database Initialized',
          message: 'PostgreSQL/SQLite database connected via Prisma ORM APIs.',
          type: 'SYSTEM',
          isRead: false,
          roomId: 'rm-104',
        },
        {
          id: 'notif-2',
          title: 'Maintenance Alert',
          message: 'Room 104: URGENT HVAC ticket logged in database.',
          type: 'MAINTENANCE_ALERT',
          isRead: false,
          roomId: 'rm-104',
          ticketId: 'tkt-101',
        },
      ],
    });

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully with Prisma ORM!',
      count: rooms.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
