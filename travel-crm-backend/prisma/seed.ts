import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding...');

    // Hash passwords
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const agentPasswordHash = await bcrypt.hash('agent123', 10);

    // Clear existing data in correct relational order
    await prisma.comment.deleteMany();
    await prisma.traveler.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.user.deleteMany();

    // 1. Create Admin User
    const admin = await prisma.user.create({
        data: {
            name: 'Super Admin',
            email: 'admin@travel.com',
            passwordHash: adminPasswordHash,
            role: 'ADMIN',
        },
    });

    const admin2 = await prisma.user.create({
        data: {
            name: 'Admin 2',
            email: 'admin2@travel.com',
            passwordHash: adminPasswordHash,
            role: 'ADMIN',
        },
    });
    console.log(`Created admin user with id: ${admin.id} and ${admin2.id}`);

    const agent1User = await prisma.user.create({
        data: {
            name: 'Memo Agent',
            email: 'agent1@travel.com',
            passwordHash: agentPasswordHash, // Uses agent123
            role: 'AGENT',
        },
    });

    const agent1 = await prisma.user.create({
        data: {
            name: 'Sarah Agent',
            email: 'sarah@travel.com',
            passwordHash: agentPasswordHash,
            role: 'AGENT',
        },
    });

    const agent2 = await prisma.user.create({
        data: {
            name: 'Mike Agent',
            email: 'mike@travel.com',
            passwordHash: agentPasswordHash,
            role: 'AGENT',
        },
    });

    console.log(`Created agent users.`);

    const agents = [agent1User.id, agent1.id, agent2.id];
    const statuses = ['Pending', 'Working', 'Sent', 'Booked', 'Booked']; // Skew towards Booked

    const mockDestinations = ['Paris, France', 'Bali, Indonesia', 'Tokyo, Japan', 'Cancun, Mexico', 'Rome, Italy', 'Maldives', 'Swiss Alps', 'Dubai, UAE'];
    const mockNames = ['John Smith', 'Sarah Connor', 'Michael Jordan', 'Emma Watson', 'James Bond', 'Alice Wonderland', 'Bruce Wayne', 'Clark Kent'];

    let totalBookings = 0;

    for (let i = 1; i <= 20; i++) {
        const status = statuses[i % statuses.length];
        const isConvertedToEDT = status === 'Booked';
        const destination = mockDestinations[i % mockDestinations.length];
        const contact = mockNames[i % mockNames.length];

        // Random past date within last 30 days
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - Math.floor(Math.random() * 30));

        const booking = await prisma.booking.create({
            data: {
                contactPerson: contact,
                contactNumber: `+1555${Math.floor(1000000 + Math.random() * 9000000)}`,
                requirements: `Looking for a luxury 7-day trip to ${destination} for ${i % 4 + 1} people. Need 5-star accommodation, direct flights if possible, and airport transfers. Would also love a private tour guide for at least 2 days.`,
                status: status,
                isConvertedToEDT: isConvertedToEDT,
                assignedToUserId: i % 3 !== 0 ? agents[i % 2] : null, // ~33% unassigned
                createdByUserId: admin.id,
                createdAt: pastDate,
                updatedAt: pastDate,
            },
        });

        totalBookings++;

        // Add varying number of comments
        const numComments = Math.floor(Math.random() * 3) + 1; // 1 to 3 comments
        for (let c = 1; c <= numComments; c++) {
            const commentDate = new Date(pastDate);
            commentDate.setHours(commentDate.getHours() + c * 2);

            await prisma.comment.create({
                data: {
                    bookingId: booking.id,
                    createdById: i % 2 === 0 ? agents[0] : admin.id,
                    text: c === 1 ? `Initial consultation completed. Client is very interested in ${destination}.` : `Follow up email sent. Awaiting documents.`,
                    createdAt: commentDate,
                }
            });
        }

        // Add detailed travelers if booked
        if (status === 'Booked') {
            const travelDate = new Date();
            travelDate.setDate(travelDate.getDate() + 30 + Math.floor(Math.random() * 60)); // 1-3 months in future

            const numTravelers = i % 3 + 1; // 1 to 3 travelers

            for (let t = 0; t < numTravelers; t++) {
                await prisma.traveler.create({
                    data: {
                        bookingId: booking.id,
                        name: t === 0 ? contact : `${contact.split(' ')[0]}'s Family Member ${t}`,
                        phoneNumber: t === 0 ? `+1555${Math.floor(1000000 + Math.random() * 9000000)}` : '',
                        email: t === 0 ? `${contact.toLowerCase().replace(' ', '.')}@example.com` : '',
                        country: destination.split(',')[1]?.trim() || 'Europe',
                        flightFrom: 'JFK',
                        flightTo: t % 2 === 0 ? 'LHR' : 'CDG',
                        departureTime: new Date(travelDate.getTime() - 86400000).toISOString().slice(0, 16),
                        arrivalTime: new Date(travelDate.getTime() - 86400000 + 48600000).toISOString().slice(0, 16),
                        tripType: i % 2 === 0 ? 'round-trip' : 'one-way',
                        dob: new Date(1980 + Math.floor(Math.random() * 20), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)).toISOString().split('T')[0],
                        anniversary: t === 0 && i % 2 === 0 ? new Date(2010 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)).toISOString().split('T')[0] : null,
                    }
                });
            }
        }
    }

    console.log(`Successfully generated ${totalBookings} comprehensive mock bookings.`);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
