'use strict';

const { start, sequelizeDatabase } = require('./src/server');

sequelizeDatabase.sync()
  .then(() => {
    console.log('server up');
    start();
  })
  .catch((e) => console.error(e));
