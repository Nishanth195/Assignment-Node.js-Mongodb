import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import moment from 'moment-timezone';

const uri = 'mongodb://localhost:27017/trial'; // Your MongoDB URI
const client = new MongoClient(uri, {});

// Set your desired time zone here
moment.tz.setDefault('Asia/India'); // Replace 'YourTimeZone' with your desired time zone

async function connectToMongoDB() {
  try {
    await client.connect();
    console.log('MongoDB connected successfully');
    const db = client.db('trial'); // Replace with your actual database name

    // CRUD operations and aggregation can access the 'db' object here
    await performCRUDOperations(db);
    await retrieveMostActiveGroups(db);
    await addTestPosts(db);
    // Check posts in the 'posts' collection
    await checkPosts(db);
  } catch (err) {
    console.error('MongoDB connection failed:', err);
  } finally {
    // Close the MongoDB client when done
    await client.close();
  }
}

async function addTestPosts(db) {
  const postsCollection = db.collection('posts');
  
  try {
    const now = new Date(); // Current date and time
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

    const testPosts = [
      { groupId:new ObjectId("6516eadbb029d404b0c196a4"), createdAt: lastWeek },
      { groupId:new ObjectId("6516d690f084a3a3da0cf28b"), createdAt: lastWeek },
      { groupId:new ObjectId("6517d51dcbde365d3bfd0b02"), createdAt: lastWeek },
      // Add more test posts with different group IDs and recent timestamps
    ];

    await postsCollection.insertMany(testPosts);
    console.log('Test posts added:', testPosts);
  } catch (err) {
    console.error('Error adding test posts:', err);
  }
}

async function checkPosts(db) {
  const postsCollection = db.collection('posts');

  try {
    const posts = await postsCollection.find({}).toArray();
    //console.log('Posts:', posts);
  } catch (err) {
    console.error('Error checking posts:', err);
  }
}

// Add your performCRUDOperations and retrieveMostActiveGroups functions here

async function performCRUDOperations(db) {
  const groupsCollection = db.collection('groups');
  const postsCollection = db.collection('posts');

  // Create a new group
  const newGroup = { name: 'Group A' };
  await groupsCollection.insertOne(newGroup);
  console.log('Group created:', newGroup);

  // Retrieve groups
  const groups = await groupsCollection.find({}).toArray();
  console.log('Groups:', groups);
}

async function retrieveMostActiveGroups(db) {
  const postsCollection = db.collection('posts');
  
  // Specify your desired time frame in days
  const timeFrameInDays = 30; // Change this value to your desired time frame
  
  // Aggregation pipeline to retrieve most active groups based on recent post counts
  const aggregationPipeline = [
    {
      $match: {
        createdAt: { $gte: new Date(Date.now() - timeFrameInDays * 24 * 60 * 60 * 1000) } // Filter posts from the last 'timeFrameInDays' days
      }
    },
    {
      $group: {
        _id: '$groupId',
        totalRecentPosts: { $sum: 1 }
      }
    },
    {
      $sort: { totalRecentPosts: -1 }
    },
    {
      $lookup: {
        from: 'groups',
        localField: '_id',
        foreignField: '_id',
        as: 'group'
      }
    },
    {
      $unwind: '$group'
    },
    {
      $project: {
        groupName: '$group.name',
        totalRecentPosts: 1
      }
    }
  ];

  try {
    const activeGroups = await postsCollection.aggregate(aggregationPipeline).toArray();
    console.log('Most active groups based on the new criteria:', activeGroups);
  } catch (err) {
    console.error('Error retrieving most active groups:', err);
  }
}



connectToMongoDB();

// Create an Express.js application
const app = express();
const port = process.env.PORT || 5000;

// Middleware to open and close MongoDB connection
app.use(async (req, res, next) => {
  try {
    req.db = await connectToMongoDB();
    next();
  } catch (err) {
    console.error('MongoDB connection error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Middleware to parse JSON requests
app.use(express.json());

// Define your API routes here (e.g., CRUD operations)
app.get('/api/posts', async (req, res) => {
  const postsCollection = req.db.collection('posts');
  try {
    const posts = await postsCollection.find({}).toArray();
    res.json(posts);
  } catch (err) {
    console.error('Error fetching posts:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the Express server
const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Handle server shutdown
process.on('SIGINT', () => {
  closeMongoDBConnection().finally(() => {
    console.log('Server and MongoDB connection closed.');
    server.close(() => {
      console.log('Express server closed.');
      process.exit(0);
    });
  });
});
