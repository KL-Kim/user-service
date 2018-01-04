import request from 'supertest';
import httpStatus from 'http-status';
import chai, { expect } from 'chai';

import app from '../../index';
import Usercontroller from '../../controller/user.controller';

chai.config.includeStack = true;

const userController = new Usercontroller();

describe('Test user controller', function() {

	it("should return Users[] only if the user's role is 'admin'", function(done) {
		request(app)
			.get('/api/v1/user/')
			.set('Authorization', 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiI1YTRhNGQ0ZTNmNWUxMzAyM2RlZjYzMjciLCJ0aWQiOiJjYjlkNmY2MC1lZjg5LTExZTctYjI2NS0wMTU3Zjk2NzdiZmMiLCJpYXQiOjE1MTQ4NzYwNzYsImV4cCI6MTUxNTA0ODg3Nn0.PxF5ACLAVRjQV8NoqlJIkl4CLeCNeYBcGxqpgS51GiiB8q7Yd2-506E_vBEzSCDlUvNWLo_sn9GSx9ucoYR3EU785WF420VvJ--leNArZEoMmhmAXmK-klI1qUO4Zpz1Q2Aw0mkNV2TKEhV1xjp9bePuwQWbvgSYoY3vnx0uS5QPxGJ3689w1S6N-JIVcH6CpwvMWtPAMZWRZJ1gu1zKTKDqgdOgPbfobxuK3LeUffDXSn7G7n9MGZN2pMkSVL1CoT_U5ROP5Trm-kUfqOXSw-maEi0hZ6EOJnG_QCyJChhcvWwwz5u8iBf-aiupdoWmKpNyYVEJvHPkh-TXAGJwxg')
			.expect('Content-Type', /json/)
			.expect(httpStatus.UNAUTHORIZED)
			.then((res) => {
				console.log(res.body);

				done();
			}).catch(done);
	});
});