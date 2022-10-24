'use strict';

const { UsersModel } = require('../models');
const bcrypt = require('bcrypt');
const base64 = require('base-64');

async function basicAuth(req, res, next) {
  let { authorization } = req.headers;

  if (!authorization) {
    res.status(401).send('Not Authorized');
  } else {

    let authString = authorization.split(' ')[1];
    console.log('authStr:', authString);

    let decodedAuthString = base64.decode(authString);
    console.log('decodedAuthString:', decodedAuthString);

    let [ username, password ] = decodedAuthString.split(':');
    console.log('username:', username);
    console.log('password:', password);


    let user = await UsersModel.findOne({where: { username }});
    console.log('user:', user);

    if(user){

      let validUser = await bcrypt.compare(password, user.password);
      console.log('validUser', validUser);

      if(validUser){
        req.user = user;
        next();
      } else {

        next('Not Authorized');
      }
    }

  }
}

module.exports = basicAuth;

