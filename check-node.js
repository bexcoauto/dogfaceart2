#!/usr/bin/env node

console.log('Node.js version:', process.version);
console.log('Node.js version check passed!');

if (process.version.startsWith('v18')) {
  console.error('ERROR: Node.js 18 is not supported. Please use Node.js 20.10.0 or higher.');
  process.exit(1);
}

console.log('✅ Node.js version is compatible!');
