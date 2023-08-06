const express = require("express");
const app = express();
app.use(express.json());

const bcrypt = require("bcrypt");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "userData.db");
let db = null;

const initialize = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3009, () => {
      console.log(`Server is running at http://localhost:3009/`);
    });
  } catch (e) {
    console.log(`${e.message}`);
  }
};
initialize();

// Register User
app.post("/register/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const userQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const dbUser = await db.get(userQuery);
  //   console.log(dbUser);
  if (password.length < 5) {
    response.status(400);
    response.send("Password is too short");
  } else if (dbUser === undefined) {
    try {
      const getQuery = `
        INSERT INTO user (username, name, password, gender, location)
        VALUES (
            '${username}',
            '${name}',
            '${hashedPassword}',
            '${gender}',
            '${location}'
        );`;
      await db.run(getQuery);
      response.status(200);
      response.send("User created successfully");
    } catch (e) {
      console.log(`${e.message}`);
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

// Login User
app.post("/login/", async (request, response) => {
  try {
    const { username, password } = request.body;
    const userQuery = `SELECT * FROM user WHERE username = '${username}';`;
    const dbUser = await db.get(userQuery);
    if (dbUser === undefined) {
      response.status(400);
      response.send("Invalid user");
    } else {
      const match = await bcrypt.compare(password, dbUser.password);
      if (match === true) {
        response.status(200);
        response.send("Login success!");
      } else {
        response.status(400);
        response.send("Invalid password");
      }
    }
  } catch (e) {
    console.log(`${e.message}`);
  }
});

// Change password
app.put("/change-password/", async (request, response) => {
  try {
    const { username, oldPassword, newPassword } = request.body;
    const userQuery = `SELECT * FROM user WHERE username = '${username}';`;
    const dbUser = await db.get(userQuery);
    const match = await bcrypt.compare(oldPassword, dbUser.password);
    if (match === false) {
      response.status(400);
      response.send("Invalid current password");
    } else {
      if (newPassword.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const updatedPassword = await bcrypt.hash(newPassword, 10);
        const getQuery = `UPDATE user SET password = '${updatedPassword}' where username = '${username}';`;
        await db.run(getQuery);
        response.status(200);
        response.send("Password updated");
      }
    }
  } catch (e) {
    console.log(`${e.message}`);
  }
});

module.exports = app;
