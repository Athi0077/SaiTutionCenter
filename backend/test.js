require('mongoose').connect('mongodb+srv://aathi6944_db_user:Yr3P2OR9a6Cl6UtJ@cluster0.zgdwobk.mongodb.net/studymate?retryWrites=true&w=majority&appName=Cluster0').then(async () => { 
  const User = require('./src/models/User'); 
  const users = await User.find({role: { $in: ['driver', 'attendant'] }}); 
  console.log(users); 
  process.exit(0); 
}).catch(err => {
  console.error(err);
  process.exit(1);
});
