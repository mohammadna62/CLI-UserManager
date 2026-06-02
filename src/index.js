#!/usr/bin/env node

const yargs = require('yargs');
const chalk = require('chalk');
const figlet = require('figlet');
const { initDB } = require('./db/connection');
const { createUser, getAllUsers, updateUser, deleteUser, searchUsers } = require('./models/user');
const {
  mainMenu,
  createUserPrompt,
  updateUserPrompt,
  deleteUserPrompt,
  searchUserPrompt
} = require('./prompts/userPrompts');

const showBanner = () => {
  console.log(
    chalk.cyan(
      figlet.textSync('UserForge', { font: 'Standard', horizontalLayout: 'default' })
    )
  );
  console.log(chalk.green('✨ Mohammad Naghavi Olyaei - CLI Tool with Inquirer ✨\n'));
};

const displayUsers = (users, title = 'Users List') => {
  if (users.length === 0) {
    console.log(chalk.yellow('\nNo users found\n'));
    return;
  }
  
  console.log(chalk.cyan(`\n${title}:\n`));
  console.log(chalk.gray('-'.repeat(90)));
  
  users.forEach((user, index) => {
    console.log(
      chalk.white(`${(index + 1).toString().padStart(2)}. `) +
      chalk.yellow(`ID: ${user.id}`) +
      chalk.gray(' | ') +
      chalk.green(`Name: ${user.name}`) +
      chalk.gray(' | ') +
      chalk.blue(`Username: ${user.username}`) +
      chalk.gray(' | ') +
      chalk.magenta(`Email: ${user.email}`)
    );
    if (user.created_at) {
      console.log(chalk.gray(`    Created: ${user.created_at}`));
    }
  });
  
  console.log(chalk.gray('-'.repeat(90)));
  console.log(chalk.green(`\nTotal: ${users.length} user(s)\n`));
};

const runInteractiveMode = async () => {
  let running = true;
  
  while (running) {
    const action = await mainMenu();
    
    switch (action) {
      case 'create':
        console.log(chalk.cyan('\nCreating new user...\n'));
        const userData = await createUserPrompt();
        if (userData.confirm) {
          const userId = await createUser(userData.name, userData.username, userData.email);
          console.log(chalk.green('\nUser created successfully!'));
          console.log(chalk.white(`User ID: ${userId}`));
          console.log(chalk.green(`Name: ${userData.name}`));
          console.log(chalk.blue(`Username: ${userData.username}`));
          console.log(chalk.magenta(`Email: ${userData.email}\n`));
        } else {
          console.log(chalk.yellow('\nCreation cancelled\n'));
        }
        break;
        
      case 'list':
        console.log(chalk.cyan('\nFetching users...\n'));
        const users = await getAllUsers();
        displayUsers(users);
        break;
        
      case 'search':
        console.log(chalk.yellow('\nSearch users...\n'));
        const keyword = await searchUserPrompt();
        console.log(chalk.cyan(`\nSearching for "${keyword}"...\n`));
        const searchResults = await searchUsers(keyword);
        displayUsers(searchResults, `Search Results for "${keyword}"`);
        break;
        
      case 'update':
        console.log(chalk.magenta('\nUpdating user...\n'));
        const updateData = await updateUserPrompt();
        if (updateData) {
          const updated = await updateUser(updateData.userId, updateData.updates);
          if (updated) {
            console.log(chalk.green('\nUser updated successfully!\n'));
          } else {
            console.log(chalk.red('\nFailed to update user\n'));
          }
        } else {
          console.log(chalk.yellow('\nUpdate cancelled\n'));
        }
        break;
        
      case 'delete':
        console.log(chalk.red('\nDelete user...\n'));
        const deleteData = await deleteUserPrompt();
        if (deleteData) {
          const deleted = await deleteUser(deleteData.identifier, deleteData.type);
          if (deleted) {
            console.log(chalk.green('\nUser deleted successfully!\n'));
          } else {
            console.log(chalk.red('\nUser not found\n'));
          }
        } else {
          console.log(chalk.yellow('\nDeletion cancelled\n'));
        }
        break;
        
      case 'exit':
        console.log(chalk.gray('\nGoodbye!\n'));
        running = false;
        break;
    }
    
    if (running && action !== 'exit') {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }
};

const main = async () => {
  await initDB();
  showBanner();
  
  const argv = yargs
    .scriptName('userforge')
    .usage(chalk.cyan('Usage: $0 [options]'))
    .option('interactive', {
      alias: 'i',
      type: 'boolean',
      description: 'Run in interactive mode (default)',
      default: true
    })
    .option('create', {
      alias: 'c',
      type: 'boolean',
      description: 'Quick create mode (requires --name, --username, --email)'
    })
    .option('name', {
      alias: 'n',
      type: 'string',
      description: 'User full name'
    })
    .option('username', {
      alias: 'u',
      type: 'string',
      description: 'Username'
    })
    .option('email', {
      alias: 'e',
      type: 'string',
      description: 'Email address'
    })
    .option('list', {
      alias: 'l',
      type: 'boolean',
      description: 'List all users'
    })
    .help()
    .alias('help', 'h')
    .version()
    .alias('version', 'v')
    .parse();
  
  try {
    if (argv.create && argv.name && argv.username && argv.email) {
      const userId = await createUser(argv.name, argv.username, argv.email);
      console.log(chalk.green('\nUser created successfully!'));
      console.log(chalk.white(`User ID: ${userId}\n`));
    } else if (argv.list) {
      const users = await getAllUsers();
      displayUsers(users);
    } else {
      await runInteractiveMode();
    }
  } catch (error) {
    console.log(chalk.red(`\nError: ${error.message}\n`));
    process.exit(1);
  }
};

process.on('unhandledRejection', (error) => {
  console.error(chalk.red('Unhandled rejection:', error.message));
  process.exit(1);
});

main();