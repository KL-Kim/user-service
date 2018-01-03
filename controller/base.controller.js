import BaseAutoBindedClass from '../helper/base-autobind';

class BaseController extends BaseAutoBindedClass {
	constructor() {
		super();

		if (new.target === BaseController)
			throw new TypeError("Cannot construct BaseController instances directly");
	}

	get(req, res, next) {}

	create(req, res, next) {}

	update(req, res, next) {}

	delete(req, res, next) {}

	authenticate(req, res, next) {}
}

export default BaseController;