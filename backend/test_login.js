const fetch = require('node-fetch');

async function run() {
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'vasanth@gmail.com', password: 'password123' })
  });
  const loginData = await loginRes.json();
  if (!loginData.success) {
    console.error('Login failed', loginData);
    process.exit(1);
  }
  
  const token = loginData.token;
  
  const classesRes = await fetch('http://localhost:5000/api/classes/my-classes', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const classesData = await classesRes.json();
  console.log(JSON.stringify(classesData, null, 2));
  process.exit(0);
}
run();
