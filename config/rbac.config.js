/**
 * Role based Access Control Config
 * @export {AccessControl}
 * @version 0.0.1
 */

import { AccessControl } from 'accesscontrol';

const grants = {
	guest: {
		user: {
			"create:own": ["email", "password"],
		},
	},
	regular: {
		profile: {
			"read:own": ["*", "!password", "!lastLoginAt"],
			//"update:own": ["*", "!role", "!point", "!userStatus", "!isVerified", "!createdAt", "!lastLogin"],
			"update:own": ["firstName", "lastName", "gender", "birthday", "address", "interestedIn"],
		},
		reviews: {
			"read:any": ["*"],
			"create:own": ["*"],
			"update:own": ["*"],
			"delete:own": ["*"]
		}
	},
	manager: {
		profile: {
			"read:own": ["*", "!password", "!lastLoginAt"],
			//"update:own": ["*", "!role", "!point", "!userStatus", "!isVerified", "!createdAt", "!lastLogin"],
			"update:own": ["firstName", "lastName", "gender", "birthday", "address", "interestedIn"],
		},
		business: {
			"read:any": ["*"],
			"create:any": ["*"],
			"update:any": ["*"],
			"delete:any": ["*"]
		},
	},
	admin: {
		profile: {
			"read:any": ["*", "!password"],
			"create:any": ["firstName", "lastName", "gender", "birthday", "address", "interestedIn", "userStatus", "role"],
			// "update:any": ["*",  "!point", "!createdAt", "!lastLogin"],
			"update:own": ["firstName", "lastName", "gender", "birthday", "address", "interestedIn", "userStatus", "role"],
		},
		business: {
			"read:any": ["*"],
			"create:any": ["*"],
			"update:any": ["*"],
			"delete:any": ["*"]
		},
		reviews: {
			"read:any": ["*"],
			"create:any": ["*"],
			"update:any": ["*"],
			"delete:any": ["*"]
		}
	},
	god: {
		profile: {
			"read:any": ["*", "!password"],
			"create:any": ["*", "!point", "!lastLoginAt", "!createdAt", "!lastLogin"],
			"update:any": ["*", "!point", "!lastLoginAt", "!createdAt", "!lastLogin"],
			"delete:any": ["*"]
		},
		business: {
			"read:any": ["*"],
			"create:any": ["*"],
			"update:any": ["*"],
			"delete:any": ["*"]
		},
		reviews: {
			"read:any": ["*"],
			"create:any": ["*"],
			"update:any": ["*"],
			"delete:any": ["*"]
		},
		admin: {
			"read:any": ["*", "!password"],
			"create:any": ["*"],
			"update:any": ["*"],
			"delete:any": ["*"]
		}
	}
};

const ac = new AccessControl(grants);

ac.lock();

export default ac;
