const fs = require('fs');
const path = require('path');

function replaceColor(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceColor(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('teal-')) {
                content = content.replace(/teal-/g, 'indigo-');
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Updated: ' + fullPath);
            }
        }
    });
}
replaceColor('c:/Users/harma/OneDrive/Desktop/CRM/frontend/src');
