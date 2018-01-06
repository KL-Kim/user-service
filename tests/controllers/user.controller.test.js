import Promise from 'bluebird';
import request from 'supertest';
import httpStatus from 'http-status';
import chai, { expect } from 'chai';
import JwtManager from '../../config/jwt.config';

import app from '../../config/express';

chai.config.includeStack = true;

describe('Test user route', function() {
	const admin = {
		email: "jinguanglong11@icloud.com",
		password: "1234567890"
	};

	const regular = {
		email: "user0@abc.com",
		password: "1234567890"
	};

	it("should return Users[] only if the user's role is 'admin'", function(done) {
		request(app)
			.post('/api/v1/auth/login')
			.send(admin)
			.expect(httpStatus.OK)
			.then((res) => {
				const token = res.body.token;
				const authToken = "Bearer " + token;

				request(app)
					.get('/api/v1/user/')
					.set('Authorization', authToken)
					.expect(httpStatus.OK)
					.then((res) => {
						expect(res.body).to.be.an('array');
					});

				done();
			}).catch(done);
	});

	it("should return 'Unauthorized' if the user's role is 'regular'", function(done) {
		request(app)
			.post('/api/v1/auth/login')
			.send(regular)
			.expect(httpStatus.OK)
			.then((res) => {
				const token = res.body.token;
				const authToken = "Bearer " + token;

				request(app)
					.get('/api/v1/user/')
					.set('Authorization', authToken)
					.expect(httpStatus.UNAUTHORIZED)
					.then((res) => {
						expect(res.body).to.equal('Permission denied');
					});

				done();
			}).catch(done);
	});

	it("should return 'User' if the user get own profile", function(done) {
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
						.get(`/api/v1/user/${payload.uid}`)
						.set('Authorization', authToken)
						.expect(httpStatus.OK)
						.then((res) => {
							expect(res.body._id).to.equal(payload.uid);
						});

				});

				done();
			}).catch(done);
	});

	it("shoud return result.ok if the user update own profile", function(done) {
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
						.put(`/api/v1/user/${payload.uid}`)
						.set('Authorization', authToken)
						.send({
							"firstName": "Tony",
							"lastName": "Kim",
							"sex": "male"
						})
						.expect(httpStatus.OK)
						.then((res) => {
							expect(res.body.ok).to.equal(1);
						});

				});

				done();
			}).catch(done);
	})


});
