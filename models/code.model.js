import mongoose from 'mongoose';

/**
 * Verification code mongoose schema
 */
const CodeSchema = new mongoose.Schema({
  "code": {
    type: String,
    required: true,
  },
  "phoneNumber": {
    type: String,
    required: true,
		index: {
			unique: true,
		}
  },
	"createdAt": {
		type: Date,
		default: Date.now,
		expires: '10m'
	}
});

/**
 * Methods
 */
CodeSchema.methods = {

	/**
	 * Remove unnecessary info
	 */
	toJSON() {
		let obj = this.toObject();
		delete obj.__v;
		delete obj._id;
		delete obj.createdAt;
		return obj;
	},
};

/**
 * Statics
 */
CodeSchema.statics = {

	/**
	 * Get code object by phoneNumber
	 * @param {String} number - User's phone Number
	 * @return {Promise<VerificationCode>}
	 */
	getByPhoneNumber(number) {
		return this.findOne({ "phoneNumber": number }).exec();
	}
};

module.exports = mongoose.model('VerificationCode', CodeSchema);