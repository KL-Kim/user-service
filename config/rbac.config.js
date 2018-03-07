/**
 * Role based Access Control Config
 * @export {AccessControl}
 * @version 0.0.1
 */

import { AccessControl } from 'accesscontrol';

const grants = {
	guest: {
		user: {
			"create:own": ["*"]
		}
	},
	regular: {
		profile: {
			"read:own": ["*", "!id", "!password"],
			"update:own": ["*", "!role"],
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
			"read:own": ["*", "!password"],
			"update:own": ["*"],
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
			"create:any": ["*"],
			"update:any": ["*"],
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
			"create:any": ["*"],
			"update:any": ["*"],
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
