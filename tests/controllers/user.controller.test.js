import request from 'supertest';
import httpStatus from 'http-status';
import chai, { expect } from 'chai';

import app from '../../index';
import Usercontroller from '../../controller/user.controller';

chai.config.includeStack = true;

const userController = new Usercontroller();

describe('Test user route', function() {
	var token = '';
	const admin = {
		email: "jinguanglong11@icloud.com",
		password: "1234567890"
	};

	const badAdmin = {
		email: "jinguanglong11@icloud.com",
		password: "12345678901"
	};

	before(function(done) {
		request(app)
			.post('/api/v1/auth/login')
			.send(admin)
			.then((res) => {
				expect(res.body.user);
				expect(res.body.token).to.be.a('string');
				this.token = res.body.token;

				done();
			}).catch(done);
	});

	it("should return Users[] only if the user's role is 'admin'", function(done) {
		const authToken = "Bearer " + this.token;
		request(app)
			.get('/api/v1/user/')
			.set('Authorization', authToken)
			.expect(httpStatus.OK)
			.then((res) => {
				expect(res.body).to.be.an('array');

				done();
			}).catch(done);
	});
});
