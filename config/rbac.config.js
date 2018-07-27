/**
 * Role based Access Control Config
 *
 * @version 0.0.1
 *
 * @author KL-Kim (https://github.com/KL-Kim)
 * @license MIT
 */

const grants = {
	"guest": {
		account: {
			"create:own": ["email", "password"],
			"read:any": ["_id", "username", "firstName", "lastName", "gender", "birthday", "profilePhotoUri", "favors", "interestedIn"],
		},
	},
	"regular": {
		account: {
			"read:own": ["*", "!password", "!role", "!userStatus", "!point"],
			"read:any": ["username", "firstName", "lastName", "gender", "birthday", "profilePhotoUri", "favors", "interestedIn"],
			"update:own": ["username", "firstName", "lastName", "gender", "birthday", "address", "interestedIn"],
		},
	},
	"businessOwner": {
		account: {
			"read:own": ["*", "!password", "!createdAt", "!userStatus", "!lastLogin"],
			"read:any": ["username", "firstName", "lastName", "gender", "birthday", "profilePhotoUri", "favors", "interestedIn"],
			"update:own": ["username", "firstName", "lastName", "gender", "birthday", "address", "interestedIn"],
		},
	},
	"writer": {
		account: {
			"read:own": ["*", "!password", "!createdAt", "!userStatus", "!lastLogin"],
			"read:any": ["username", "firstName", "lastName", "gender", "birthday", "profilePhotoUri", "favors", "interestedIn"],
			"update:own": ["username", "firstName", "lastName", "gender", "birthday", "address", "interestedIn"],
		},
	},
	"manager": {
		account: {
			"read:own": ["*", "!password", "!createdAt", "!userStatus"],
			"read:any": ["*", "!password"],
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
