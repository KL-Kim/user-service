require('../config/db.config');

import User from '../models/user.model';

User.remove({}, function(err) {
	if (err) throw err;

	console.log("Removed mongodb documents");
});

let god = new User({
	username: 'kim911',
	email: 'jinguanglong11@icloud.com',
	password: '1234567890',
	role: 'god',
});

god.save();

for (let i = 0; i < 100; i++) {
	let user = new User({
		username: `regularUser${i}`,
		email: `user${i}@abc.com`,
		password: '1234567890'
	});

	user.save().then((user) => {
		console.log(user.username + ' has been Added');
	});
}

// mongoose.disconnect();