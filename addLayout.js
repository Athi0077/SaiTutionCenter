const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'frontend', 'src', 'pages');

const teacherFiles = [
  'TeacherAttendance.jsx',
  'TeacherAttendanceList.jsx',
  'TeacherClassDetails.jsx',
  'TeacherClasses.jsx',
  'TeacherHomeworkCreate.jsx',
  'TeacherHomeworkDetails.jsx',
  'TeacherHomeworkList.jsx',
  'TeacherJoinRequests.jsx',
  'TeacherLeaveRequests.jsx',
  'TeacherSubmissionReview.jsx'
];

teacherFiles.forEach(file => {
  const filePath = path.join(dir, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Add import if missing
    if (!content.includes('import Layout')) {
      content = content.replace(/(import React.*?;\n)/, '$1import Layout from \'../components/layout/Layout\';\n');
    }
    
    // Wrap return statement
    if (!content.includes('<Layout>')) {
      content = content.replace(/return \([\s\S]*?(<div[\s\S]*?)(\n\s*?)\);\n};/g, (match, p1, p2) => {
        return `return (\n    <Layout>\n      ${p1.trim()}\n    </Layout>${p2});\n};`;
      });
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
