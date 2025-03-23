// adminController.js
const getAllUsers = (req, res) => {
    // Logic to fetch all users (e.g., from a database)
    const users = [
      { id: 1, name: 'John Doe' },
      { id: 2, name: 'Jane Smith' },
    ];
    res.json(users);
  };
  
  const createUser = (req, res) => {
    // Logic to create a new user
    const newUser = req.body; // Assuming the request body contains user data
    console.log('Creating user:', newUser);
    res.status(201).json({ message: 'User created successfully', user: newUser });
  };
  
  const updateUser = (req, res) => {
    // Logic to update a user
    const userId = req.params.id;
    const updatedUserData = req.body;
    console.log(`Updating user with ID: ${userId}`, updatedUserData);
    res.json({ message: 'User updated successfully', userId, updatedUserData });
  };
  
  const deleteUser = (req, res) => {
    // Logic to delete a user
    const userId = req.params.id;
    console.log(`Deleting user with ID: ${userId}`);
    res.json({ message: 'User deleted successfully', userId });
  };
  
  module.exports = {
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
  };