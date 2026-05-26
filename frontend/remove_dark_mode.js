const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('./src');
let totalReplaced = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Regex to match 'dark:' followed by word characters, dashes, and slashes
    // Example: dark:bg-slate-800, dark:border-slate-700/60, dark:shadow-none
    const regex = /\bdark:[\w\-\/\[\]]+\b/g;
    
    if (regex.test(content)) {
        // Also remove any extra spaces left behind (e.g. "bg-white  text-black")
        const newContent = content.replace(regex, '').replace(/ +/g, ' ').replace(/ "/g, '"').replace(/" /g, '"');
        fs.writeFileSync(file, newContent, 'utf8');
        totalReplaced++;
        console.log(`Updated ${file}`);
    }
}

console.log(`Replaced dark classes in ${totalReplaced} files.`);
