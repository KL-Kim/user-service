import Promise from 'bluebird';
/**
 * Promise in loop
 * @param {function} condition - Condition function, continue loop when return true
 * @param {function} action - Action function, do the job
 * @param {*} value - Initial value
 * @returns {Promise} 
 */
const promiseFor = Promise.method((condition, action, value) => {
    if (!condition(value)) return value;
    return action(value).then(promiseFor.bind(null, condition, action));
});

export default promiseFor;
