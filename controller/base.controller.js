import BaseAutoBindedClass from '../base/base-autobind';

class BaseController extends BaseAutoBindedClass {
	constructor() {
		super();

		if (new.target === BaseController)
			throw new TypeError("Cannot construct BaseController instances directly");
	}

	get(req, res) {}

	create(req, res) {}

	update(req, res) {}

	delete(req, res) {}

	authenticate(req, res, next) {}
}

export default BaseController;