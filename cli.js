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

  program
  .command('build')
  .description('Build the Banana.js project for production')
  .action(() => {
    console.log('banana build');
    const buildPath = path.join(__dirname, 'build.js');
    spawn('node', [buildPath], { stdio: 'inherit' });
  });

  
  program
  .version('1.0.0')
  .command('dev')
  .description('Start the Banana.js development server')
  .action(() => {
    console.log('banana server running');
    const serverPath = path.join(__dirname, 'server.js');
    spawn('node', [serverPath], { stdio: 'inherit' });
  });

program
  .command('login')
  .description('Log in to the plugin marketplace')
  .action(async () => {
    const email = 'rony807777@gmail.com'; // Replace with user input
    const password = 'Rony807777@gmail'; // Replace with user input
    const response = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyCCjRhmfqhVer8EKSFYA8z6O4kiMd7J64U', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });
    const data = await response.json();
    if (data.idToken) {
      fs.writeFileSync('./.banana-auth', data.idToken);
      console.log('✅ Logged in successfully!');
    } else {
      console.log('❌ Login failed.');
    }
  });

program
  .command('install <plugin-name>')
  .description('Install a plugin from the marketplace')
  .action(async (pluginName) => {
    const token = fs.readFileSync('./.banana-auth', 'utf-8');
    const response = await fetch('http://localhost:5000/plugins', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const plugins = await response.json();
    const plugin = plugins.find((p) => p.name === pluginName);

    if (plugin) {
      console.log(`Installing ${plugin.name}...`);
      const pluginCode = await fetch(plugin.url).then((res) => res.text());
      fs.writeFileSync(`./plugins/${plugin.name}.js`, pluginCode);
      console.log(`✅ ${plugin.name} installed successfully!`);
    } else {
      console.log(`❌ Plugin ${pluginName} not found.`);
    }
  });


  program.parse(process.argv);

