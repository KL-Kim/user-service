/**
 * Revoked token mongoose schema
 *
 * @version 0.0.1
 *
 * @author KL-Kim (https://github.com/KL-Kim)
 * @license MIT
 */

import mongoose from 'mongoose';

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
		expires: '60d'
	}
});

module.exports = mongoose.model('RevokedToken', RevokedTokenSchema);
