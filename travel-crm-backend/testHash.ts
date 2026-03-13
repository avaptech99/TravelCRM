import bcrypt from 'bcryptjs';

const hash = '$2a$10$PdK.YyXTIhzQLbTC8is8ieInz0oBrYwxAPF5/dpSVGRY694CQFwHW';

const testPasswords = async () => {
    const passwords = ['password', 'admin', 'admin123', 'travelCRM', 'admin@123', 'travelwindow', 'admin@travel.com', 'Travel@123', 'admin1234'];
    
    for (const p of passwords) {
        const match = await bcrypt.compare(p, hash);
        console.log(`Password: ${p} - Match: ${match}`);
    }
};

testPasswords();
