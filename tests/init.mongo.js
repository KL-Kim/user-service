require('../config/db.config');

import User from '../models/user.model';

User.remove({}, function(err) {
	if (err) throw err;

	console.log("Removed mongodb documents");
});

let admin = new User({
	username: 'adminKim911',
	email: 'jinguanglong11@icloud.com',
	password: 'asdfasdf',
	role: 'admin',
	isVerified: true,
});

admin.save();

let writer = new User({
	username: 'writer',
	email: 'writer@abc.com',
	password: 'asdfasdf',
	role: 'writer',
	isVerified: true,
});

writer.save();

let manager = new User({
	username: 'manager',
	email: 'manager@abc.com',
	password: 'asdfasdf',
	role: 'manager',
	isVerified: true,
});

manager.save();

let regular = new User({
	username: 'regular',
	email: 'jinguanglong11@hotmail.com',
	password: 'asdfasdf',
	role: 'regular',
	isVerified: true,
});

regular.save();

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
