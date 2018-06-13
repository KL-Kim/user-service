/**
 * Promise in loop
 * @param {Function} condition - Condition function, continue loop when return true
 * @param {Function} action - Action function, do the job
 * @param {*} value - Initial value
 * @returns {Promise<*>}
 */

import Promise from 'bluebird';

const promiseFor = Promise.method((condition, action, value) => {
    if (!condition(value)) return value;
    return action(value).then(promiseFor.bind(null, condition, action));
});

export default promiseFor;
