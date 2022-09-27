'use strict';

sequelizeDatabase.sync()
  .then(() => {
    console.log('server up');
    start();
})
.catch((e) => console.error(e));
