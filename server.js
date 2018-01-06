'use strict';

import spdy from 'spdy';

import config from './config/config';
import app from './config/express';

const options = {
  // Private key
  key: config.serverPrivateKey,

  // Fullchain file or cert file (prefer the former)
  cert: config.serverPublicKey,

  // **optional** SPDY-specific options
  spdy: {
    protocols: [ 'h2', 'spdy/3.1', 'http/1.1' ],
    plain: false,

    // **optional**
    // Parse first incoming X_FORWARDED_FOR frame and put it to the
    // headers of every request.
    // NOTE: Use with care! This should not be used without some proxy that
    // will *always* send X_FORWARDED_FOR
    'x-forwarded-for': true,

    connection: {
      windowSize: 1024 * 1024, // Server's window size

      // **optional** if true - server will send 3.1 frames on 3.0 *plain* spdy
      autoSpdy31: false
    }
  }
};

spdy.createServer(options, app)
  .listen(config.port, (error) => {
    if (error) {
      console.error(error)
      return process.exit(1)
    } else {
      console.log('Server istening on port: ' + config.port + '.')
    }
});
