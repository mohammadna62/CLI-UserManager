const inquirer = require('inquirer');
const chalk = require('chalk');
const { validateEmail, validateUsername, validateName, validateId } = require('../utils/validators');
const { getAllUsers, checkDuplicate } = require('../models/user');

const mainMenu = async () => {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: chalk.cyan('What would you like to do?'),
      choices: [
        { name: `${chalk.green('+')} Create new user`, value: 'create' },
        { name: `${chalk.blue('list')} List all users`, value: 'list' },
        { name: `${chalk.yellow('search')} Search users`, value: 'search' },
        { name: `${chalk.magenta('edit')} Update user`, value: 'update' },
        { name: `${chalk.red('delete')} Delete user`, value: 'delete' },
        { name: `${chalk.gray('exit')} Exit`, value: 'exit' }
      ],
      pageSize: 10
    }
  ]);
  
  return answers.action;
};

const createUserPrompt = async () => {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: chalk.green('Enter full name:'),
      validate: (input) => {
        if (validateName(input)) return true;
        return 'Name must be between 2 and 100 characters';
      }
    },
    {
      type: 'input',
      name: 'username',
      message: chalk.blue('Enter username:'),
      validate: async (input) => {
        if (!validateUsername(input)) {
          return 'Username must be 3-20 characters (letters, numbers, underscore)';
        }
        const { usernameExists } = await checkDuplicate(input, '');
        if (usernameExists) {
          return `Username '${input}' already exists!`;
        }
        return true;
      }
    },
    {
      type: 'input',
      name: 'email',
      message: chalk.magenta('Enter email:'),
      validate: async (input) => {
        if (!validateEmail(input)) {
          return 'Please enter a valid email address';
        }
        const { emailExists } = await checkDuplicate('', input);
        if (emailExists) {
          return `Email '${input}' already exists!`;
        }
        return true;
      }
    },
    {
      type: 'confirm',
      name: 'confirm',
      message: chalk.yellow('Create this user?'),
      default: true
    }
  ]);
  
  return answers;
};

const updateUserPrompt = async () => {
  const users = await getAllUsers();
  
  if (users.length === 0) {
    console.log(chalk.yellow('\nNo users found to update\n'));
    return null;
  }
  
  const choices = users.map(user => ({
    name: `${chalk.white(`#${user.id}`)} - ${chalk.green(user.name)} | ${chalk.blue(user.username)} | ${chalk.magenta(user.email)}`,
    value: user.id,
    short: `User ${user.id}`
  }));
  
  const { userId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'userId',
      message: chalk.cyan('Select user to update:'),
      choices: [...choices, { name: chalk.gray('Back to main menu'), value: null }],
      pageSize: 15
    }
  ]);
  
  if (!userId) return null;
  
  const { fields } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'fields',
      message: chalk.yellow('Which fields do you want to update?'),
      choices: [
        { name: 'Name', value: 'name' },
        { name: 'Username', value: 'username' },
        { name: 'Email', value: 'email' }
      ],
      validate: (input) => {
        if (input.length === 0) return 'Please select at least one field';
        return true;
      }
    }
  ]);
  
  const updates = {};
  
  if (fields.includes('name')) {
    const { name } = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: chalk.green('Enter new name:'),
        validate: (input) => {
          if (validateName(input)) return true;
          return 'Name must be between 2 and 100 characters';
        }
      }
    ]);
    updates.name = name;
  }
  
  if (fields.includes('username')) {
    const { username } = await inquirer.prompt([
      {
        type: 'input',
        name: 'username',
        message: chalk.blue('Enter new username:'),
        validate: async (input) => {
          if (!validateUsername(input)) {
            return 'Username must be 3-20 characters (letters, numbers, underscore)';
          }
          const { usernameExists } = await checkDuplicate(input, '', userId);
          if (usernameExists) {
            return `Username '${input}' already exists!`;
          }
          return true;
        }
      }
    ]);
    updates.username = username;
  }
  
  if (fields.includes('email')) {
    const { email } = await inquirer.prompt([
      {
        type: 'input',
        name: 'email',
        message: chalk.magenta('Enter new email:'),
        validate: async (input) => {
          if (!validateEmail(input)) {
            return 'Please enter a valid email address';
          }
          const { emailExists } = await checkDuplicate('', input, userId);
          if (emailExists) {
            return `Email '${input}' already exists!`;
          }
          return true;
        }
      }
    ]);
    updates.email = email;
  }
  
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: chalk.yellow('Confirm update?'),
      default: true
    }
  ]);
  
  if (!confirm) return null;
  
  return { userId, updates };
};

const deleteUserPrompt = async () => {
  const { method } = await inquirer.prompt([
    {
      type: 'list',
      name: 'method',
      message: chalk.red('How do you want to delete?'),
      choices: [
        { name: 'Delete by ID', value: 'id' },
        { name: 'Delete by Username', value: 'username' },
        { name: 'Delete by Email', value: 'email' },
        { name: chalk.gray('Cancel'), value: 'cancel' }
      ]
    }
  ]);
  
  if (method === 'cancel') return null;
  
  let identifier, displayValue;
  
  if (method === 'id') {
    const { id } = await inquirer.prompt([
      {
        type: 'input',
        name: 'id',
        message: chalk.cyan('Enter user ID:'),
        validate: (input) => {
          if (validateId(input)) return true;
          return 'Please enter a valid ID (positive number)';
        }
      }
    ]);
    identifier = parseInt(id);
    displayValue = `ID ${id}`;
  } else if (method === 'username') {
    const { username } = await inquirer.prompt([
      {
        type: 'input',
        name: 'username',
        message: chalk.blue('Enter username:'),
        validate: (input) => {
          if (input && input.trim()) return true;
          return 'Username cannot be empty';
        }
      }
    ]);
    identifier = username;
    displayValue = `username "${username}"`;
  } else {
    const { email } = await inquirer.prompt([
      {
        type: 'input',
        name: 'email',
        message: chalk.magenta('Enter email:'),
        validate: (input) => {
          if (validateEmail(input)) return true;
          return 'Please enter a valid email';
        }
      }
    ]);
    identifier = email;
    displayValue = `email "${email}"`;
  }
  
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: chalk.red(`Are you sure you want to delete ${displayValue}?`),
      default: false
    }
  ]);
  
  if (!confirm) return null;
  
  return { identifier, type: method };
};

const searchUserPrompt = async () => {
  const { keyword } = await inquirer.prompt([
    {
      type: 'input',
      name: 'keyword',
      message: chalk.yellow('Enter search keyword (name, username, or email):'),
      validate: (input) => {
        if (input && input.trim()) return true;
        return 'Search keyword cannot be empty';
      }
    }
  ]);
  
  return keyword;
};

module.exports = {
  mainMenu,
  createUserPrompt,
  updateUserPrompt,
  deleteUserPrompt,
  searchUserPrompt
};