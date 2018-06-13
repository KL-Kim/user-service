/**
 * CSRF Protection
 *
 * @version 0.0.1
 */
import csurf from 'csurf';

const csurfOptions = {
  cookie: true
};

export default csurf(csurfOptions);
