const { getConnection } = require('../db/connection');

const checkDuplicate = async (username, email, excludeId = null) => {
  const connection = getConnection();
  
  let usernameQuery = 'SELECT COUNT(*) as count FROM users WHERE username = ?';
  let emailQuery = 'SELECT COUNT(*) as count FROM users WHERE email = ?';
  let usernameParams = [username];
  let emailParams = [email];
  
  if (excludeId) {
    usernameQuery = 'SELECT COUNT(*) as count FROM users WHERE username = ? AND id != ?';
    emailQuery = 'SELECT COUNT(*) as count FROM users WHERE email = ? AND id != ?';
    usernameParams = [username, excludeId];
    emailParams = [email, excludeId];
  }
  
  const [usernameResult] = await connection.execute(usernameQuery, usernameParams);
  const [emailResult] = await connection.execute(emailQuery, emailParams);
  
  return {
    usernameExists: usernameResult[0].count > 0,
    emailExists: emailResult[0].count > 0
  };
};

const createUser = async (name, username, email) => {
  const connection = getConnection();
  
  const [result] = await connection.execute(
    'INSERT INTO users (name, username, email) VALUES (?, ?, ?)',
    [name, username, email]
  );
  
  return result.insertId;
};

const getAllUsers = async () => {
  const connection = getConnection();
  const [rows] = await connection.execute(
    'SELECT id, name, username, email, DATE_FORMAT(created_at, "%Y-%m-%d %H:%i:%s") as created_at FROM users ORDER BY id DESC'
  );
  return rows;
};

const getUserById = async (id) => {
  const connection = getConnection();
  const [rows] = await connection.execute(
    'SELECT id, name, username, email FROM users WHERE id = ?',
    [id]
  );
  return rows[0];
};

const updateUser = async (id, updates) => {
  const connection = getConnection();
  const fields = [];
  const values = [];
  
  if (updates.name) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.username) {
    fields.push('username = ?');
    values.push(updates.username);
  }
  if (updates.email) {
    fields.push('email = ?');
    values.push(updates.email);
  }
  
  if (fields.length === 0) return false;
  
  values.push(id);
  const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
  
  const [result] = await connection.execute(query, values);
  return result.affectedRows > 0;
};

const deleteUser = async (identifier, type = 'id') => {
  const connection = getConnection();
  let query = '';
  let param = '';
  
  if (type === 'id') {
    query = 'DELETE FROM users WHERE id = ?';
    param = identifier;
  } else if (type === 'username') {
    query = 'DELETE FROM users WHERE username = ?';
    param = identifier;
  } else if (type === 'email') {
    query = 'DELETE FROM users WHERE email = ?';
    param = identifier;
  }
  
  const [result] = await connection.execute(query, [param]);
  return result.affectedRows > 0;
};

const searchUsers = async (keyword) => {
  const connection = getConnection();
  const [rows] = await connection.execute(
    `SELECT id, name, username, email FROM users 
     WHERE name LIKE ? OR username LIKE ? OR email LIKE ?
     ORDER BY id DESC`,
    [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`]
  );
  return rows;
};

module.exports = { 
  checkDuplicate, 
  createUser, 
  getAllUsers, 
  getUserById,
  updateUser,
  deleteUser,
  searchUsers
};