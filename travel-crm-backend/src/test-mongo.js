const mongoose = require('mongoose');

async function test() {
    try {
        await mongoose.connect(' mongodb+srv://satguruengineers742_db_user:IiEP4HkjgpPYYE5X@cluster0.qr4gfbg.mongodb.net/?appName=Cluster0');
        console.log('Connected');
    } catch (e) {
        console.log('Error 1:', e.message);
    }
    try {
        await mongoose.connect('mongodb+srv://satguruengineers742_db_user:IiEP4HkjgpPYYE5X@cluster0.qr4gfbg.mongodb.net/?appName=Cluster0 ');
        console.log('Connected');
    } catch (e) {
        console.log('Error 2:', e.message);
    }
}
test();
