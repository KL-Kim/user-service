import mongoose from 'mongoose';

/**
 * Revoked token mongoose schema
 */
const RevokedTokenSchema = new mongoose.Schema({
	id: {
		type: String,
		required: true,
		index: {
			unique: true
		}
	},
	createdAt: {
		type: Date,
		default: Date.now,
		expires: '2d'
	}
});

module.exports = mongoose.model('RevokedToken', RevokedTokenSchema);