'use strict';

// 3rd Party Resources
require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const base64 = require('base-64');
const { Sequelize, DataTypes } = require('sequelize');

// Prepare the express app
const app = express();

const PORT = process.env.PORT || 3002;

// Process JSON input and put the data on req.body
app.use(express.json());

const DATABASE_URL = process.env.NODE_ENV === 'test'
  ? 'sqlite::memory'
  : process.env.DATABASE_URL;

const sequelizeDatabase = new Sequelize(DATABASE_URL);

// Process FORM intput and put the data on req.body
app.use(express.urlencoded({ extended: true }));

// Create a Sequelize model
const Users = sequelizeDatabase.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});





async function basicAuth(req, res, next) {
  let { authorization } = req.headers;
  console.log('authorization::::', authorization);
  // confirm request header has an "authorization" property
  if (!authorization) {
    res.status(401).send('Not Authorized');
  } else {
    // Parse the basic auth string
    let authString = authorization.split(' ')[1];
    console.log('authStr:', authString); // dGVzdDpwYXNz

    let decodedAuthString = base64.decode(authString);
    console.log('decodedAuthString:', decodedAuthString); // test:pass

    let [ username, password ] = decodedAuthString.split(':');
    console.log('username:', username);
    console.log('password:', password);

    // find the user in the database
    let user = await Users.findOne({where: { username }});
    console.log('user:', user);
    // IF the user exists (in database after a signup request)...
    if(user){
      // compare  password from database to the signin password
      // note: password could also be sent from a logged in client
      let validUser = await bcrypt.compare(password, user.password);
      console.log('validUser', validUser);
      // if valid user DOES exist...
      if(validUser){
        // attach user to the request object
        req.user = user;
        // basicAuth middleware is done, pass request to next middleware
        next();
        // if valid user DOES NOt exist...
      } else {
        // send a "Not Authorized" error to express middleware
        next('Not Authorized');
      }
    }

  }
}





app.post('/signup', basicAuth, async (req, res, next) => {

  try {
    let { username, password } = req.body;
    let encryptedPassword = await bcrypt.hash(password, 5);

    let user = await Users.create({
      username,
      password: encryptedPassword,
    });

    res.status(201).send(user);
  } catch (err) {
    next('signup error occurred');
  }
});




// Signin Route -- login with username and password
// test with httpie
// http post :3000/signin -a john:foo
app.post('/signin', async (req, res) => {
  res.status(200).send(req.user);

  /*
    req.headers.authorization is : "Basic sdkjdsljd="
    To get username and password from this, take the following steps:
      - Turn that string into an array by splitting on ' '
      - Pop off the last value
      - Decode that encoded string so it returns to user:pass
      - Split on ':' to turn it into an array
      - Pull username and password from that array
  */

  let basicHeaderParts = req.headers.authorization.split(' ');  // ['Basic', 'sdkjdsljd=']
  let encodedString = basicHeaderParts.pop();  // sdkjdsljd=
  let decodedString = base64.decode(encodedString); // "username:password"
  let [username, password] = decodedString.split(':'); // username, password

  /*
    Now that we finally have username and password, let's see if it's valid
    1. Find the user in the database by username
    2. Compare the plaintext password we now have against the encrypted password in the db
       - bcrypt does this by re-encrypting the plaintext password and comparing THAT
    3. Either we're valid or we throw an error
  */
  try {
    const user = await Users.findOne({ where: { username: username } });
    const valid = await bcrypt.compare(password, user.password);
    if (valid) {
      res.status(200).json(user);
    }
    else {
      throw new Error('Invalid User');
    }
  } catch (error) { res.status(403).send('Invalid Login'); }

});

// make sure our tables are created, start up the HTTP server.
// sequelizeDatabase.sync()
//   .then(() => {
//     app.listen(3001, () => console.log('server up'));
//   }).catch(e => {
//     console.error('Could not start server', e.message);
//   });

function start(){
  app.listen(PORT, () => console.log(`listening on port ${PORT}`));
}

module.exports = { app, start, sequelizeDatabase };
