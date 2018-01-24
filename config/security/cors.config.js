/**
 * Cross-Origin Resource Sharing Configuration
 */
import cors from 'cors';

const whitelist = [
		'http://localhost:3000',
];

let corsOptions = {
	origin: true,
	credentials: true,
}

if (process.env.NODE_ENV === 'production') {
	corsOptions.origin = (origin, callback) => {
		if (whitelist.indexOf(origin) !== -1) {
		 callback(null, true)
	 } else {
		 callback(new Error('Not allowed by CORS'))
	 }
	}
}

export default cors(corsOptions);
