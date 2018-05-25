/**
 * Role based Access Control Config
 * @export {Object}
 * @version 0.0.1
 */

const grants = {
	guest: {
		account: {
			"create:own": ["email", "password"],
			"read:any": ["username", "firstName", "lastName", "gender", "birthday", "profilePhotoUri", "favors", "interestedIn"],
		},
	},
	regular: {
		account: {
			"read:own": ["*", "!password", "!role", "!createdAt", "!userStatus", "!lastLogin", "!point"],
			"read:any": ["username", "firstName", "lastName", "gender", "birthday", "profilePhotoUri", "favors", "interestedIn"],
			"update:own": ["username", "firstName", "lastName", "gender", "birthday", "address", "interestedIn"],
		},
		reviews: {
			"read:any": ["*"],
			"create:own": ["*"],
			"update:own": ["*"],
			"delete:own": ["*"]
		}
	},
	manager: {
		account: {
			"read:own": ["*", "!password", "!createdAt", "!userStatus"],
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
		account: {
			"read:any": ["*", "!password"],
			"update:any": ["role", "userStatus"],
			"update:own": ["firstName", "lastName", "gender", "birthday", "address", "interestedIn"],
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
	},
	god: {
		account: {
			"read:any": ["*", "!password"],
			"create:any": ["*", "!lastLogin"],
			"update:any": ["*", "!createdAt", "!lastLogin"],
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

export default grants;
