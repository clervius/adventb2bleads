var path = require('path');
	rootPath = path.normalize(__dirname + '/../../');

module.exports = {
	development: {
		db: 'mongodb://clervius:JcVrm431@ds153705.mlab.com:53705/b2bleads',
		rootPath: rootPath,
		port: process.env.PORT || 5100,
		where: 'development - local',
		secrets: {
			session: 'adventb2b'
			},
		userRoles: ['user', 'admin'],
		keys: {
			access: process.env.access,
			secret: process.env.secret,
			bucket: process.env.bucket,
			region: process.env.region
			}
	},
	production: {
		db: 'mongodb://clervius:JcVrm431@ds153705.mlab.com:53705/b2bleads',
		rootPath: rootPath,
		port: process.env.PORT || 80,
		where: 'production - mlab',
		secrets: {
			session: 'bigbodies-production'
			},
		userRoles: ['user', 'admin'],
		keys: {
			access: process.env.access,
			secret: process.env.secret,
			bucket: process.env.bucket,
			region: process.env.region
			}
	}
}