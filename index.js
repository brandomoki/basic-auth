'use strict';

const { start, sequelizeDatabase } = require('./src/server');

sequelizeDatabase.sync()
  .then(() => {
    console.log('Successful Connection!');
    start();
  })
  .catch(err => console.error(err));

