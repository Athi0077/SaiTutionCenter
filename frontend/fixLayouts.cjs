const fs = require('fs');
const path = require('path');

const directoryPath = 'e:\\code\\Projects\\HomeWork\\project\\frontend\\src\\pages';

fs.readdir(directoryPath, (err, files) => {
  if (err) {
    return console.log('Unable to scan directory: ' + err);
  } 

  files.forEach((file) => {
    if (file.startsWith('Student') && file !== 'StudentDashboard.jsx') {
      const filePath = path.join(directoryPath, file);
      let data = fs.readFileSync(filePath, 'utf8');
      
      if (!data.includes('import Layout from')) {
        // Add import
        data = data.replace('import React', "import Layout from '../components/layout/Layout';\nimport React");
        
        // Wrap return value
        data = data.replace(/return\s*\(\s*<div/g, 'return (\n    <Layout>\n    <div');
        data = data.replace(/<\/div>\s*\);\s*};\s*export default/g, '</div>\n    </Layout>\n  );\n};\n\nexport default');
        
        fs.writeFileSync(filePath, data);
        console.log(`Updated ${file}`);
      }
    }
  });
});
