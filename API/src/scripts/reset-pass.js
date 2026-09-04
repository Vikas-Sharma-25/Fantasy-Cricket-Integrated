const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const atlasUri = 'mongodb+srv://vikass78901_db_user:VikasCricket2026@cluster0.oh8z9di.mongodb.net/fantasy_cricket?retryWrites=true&w=majority';

async function run() {
  const client = new MongoClient(atlasUri);
  await client.connect();
  const db = client.db();
  const newHash = bcrypt.hashSync('123456', 12);
  const res = await db.collection('users').updateOne(
    { email: 'vikass78901@gmail.com' },
    { $set: { passwordHash: newHash, isVerified: true, status: 'active' } }
  );
  console.log('Password reset successful for vikass78901@gmail.com to 123456:', res.modifiedCount > 0 || res.matchedCount > 0);
  await client.close();
}

run();

