/**
 * Role based Access Control Config
 * @export {Object}
 * @version 0.0.1
 */

const grants = {
	"guest": {
		account: {
			"create:own": ["email", "password"],
			"read:any": ["username", "firstName", "lastName", "gender", "birthday", "profilePhotoUri", "favors", "interestedIn"],
		},
	},
	"regular": {
		account: {
			"read:own": ["*", "!password", "!role", "!createdAt", "!userStatus", "!lastLogin"],
			"read:any": ["username", "firstName", "lastName", "gender", "birthday", "profilePhotoUri", "favors", "interestedIn"],
			"update:own": ["username", "firstName", "lastName", "gender", "birthday", "address", "interestedIn"],
		},
	},
	"owner": {
		account: {
			"read:own": ["*", "!password", "!role", "!createdAt", "!userStatus", "!lastLogin"],
			"read:any": ["username", "firstName", "lastName", "gender", "birthday", "profilePhotoUri", "favors", "interestedIn"],
			"update:own": ["username", "firstName", "lastName", "gender", "birthday", "address", "interestedIn"],
		},
	},
	"writer": {
		account: {
			"read:own": ["*", "!password", "!role", "!createdAt", "!userStatus", "!lastLogin"],
			"read:any": ["username", "firstName", "lastName", "gender", "birthday", "profilePhotoUri", "favors", "interestedIn"],
			"update:own": ["username", "firstName", "lastName", "gender", "birthday", "address", "interestedIn"],
		},
	},
	"manager": {
		account: {
			"read:own": ["*", "!password", "!createdAt", "!userStatus"],
			//"update:own": ["*", "!role", "!point", "!userStatus", "!isVerified", "!createdAt", "!lastLogin"],
			"update:own": ["firstName", "lastName", "gender", "birthday", "address", "interestedIn"],
		},
	},
	"admin": {
		account: {
			"read:any": ["*", "!password"],
			"update:any": ["role", "userStatus"],
			"update:own": ["firstName", "lastName", "gender", "birthday", "address", "interestedIn"],
		},
	},
	"god": {
		account: {
			"read:any": ["*", "!password"],
			"create:any": ["*", "!lastLogin"],
			"update:any": ["*", "!createdAt", "!lastLogin"],
			"delete:any": ["*"]
		},
	}
};

export default grants;
