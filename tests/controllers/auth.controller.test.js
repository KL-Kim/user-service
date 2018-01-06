import Promise from 'bluebird';
import request from 'supertest';
import httpStatus from 'http-status';
import chai, { expect } from 'chai';
import JwtManager from '../../config/jwt.config';

import app from '../../config/express';

chai.config.includeStack = true;

describe("Test auth route", () => {
	const admin = {
		email: "jinguanglong11@icloud.com",
		password: "1234567890"
	};

	const regular = {
		email: "user0@abc.com",
		password: "1234567890"
	};

	it("should return 'ok' if the user log out and revoke token successfully", function(done) {
		request(app)
			.post('/api/v1/auth/login')
			.send(regular)
			.expect(httpStatus.OK)
			.then((res) => {
				const token = res.body.token;
				const authToken = "Bearer " + token;
				const jwtManager = new JwtManager();
				jwtManager._verify(token)
				.then((payload) => {

					request(app)
						.get(`/api/v1/auth/logout`)
						.set('Authorization', authToken)
						.expect(httpStatus.OK)
						.then((res) => {
							expect(res.body.ok).to.equal(1);
						});

				});

				done();
			}).catch(done);
	});
})
