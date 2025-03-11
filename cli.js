#!/usr/bin/env node
const { program } = require('commander');
const fs = require('fs-extra');
const path = require('path');

program
  .version('1.0.0')
  .command('create <project-name>')
  .description('Create a new Banana.js project')
  .action((projectName) => {
    const templateDir = path.join(__dirname, 'templates/default');
    const projectDir = path.join(process.cwd(), projectName);

    // Copy template to project directory
    fs.copySync(templateDir, projectDir);

    console.log(`🎉 Success! Created ${projectName} at ${projectDir}`);
    console.log('👉 Get started with:');
    console.log(`cd ${projectName}`);
    console.log('yarn install');
    console.log('yarn dev');
  });

program.parse(process.argv);





