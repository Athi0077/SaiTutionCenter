const fs = require('fs');

async function debug() {
  try {
    const data = JSON.parse(fs.readFileSync('./data/users.json', 'utf8'));
    const student = data.students[0];
    
    if (!student || !student.token) {
      console.error("No student token found in users.json");
      return;
    }

    console.log(`Testing with student ID: ${student.id}`);
    
    const response = await fetch('http://localhost:5001/api/dashboard/student', {
      headers: {
        'Authorization': `Bearer ${student.token}`,
        'Content-Type': 'application/json'
      }
    });

    const status = response.status;
    let body;
    try {
      body = await response.text();
    } catch (e) {
      body = "Could not read body";
    }

    console.log(`Status: ${status}`);
    console.log(`Body: ${body}`);

  } catch (err) {
    console.error("Debug failed:", err);
  }
}

debug();
