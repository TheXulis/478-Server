let express = require('express');
let httpApp = express();
let httpsApp = express();
let http = require('http');
let https = require('https');
let fs = require('fs');
let helmet = require('helmet');
let mongoose = require('mongoose');
let Task = require('./api/models/todoListModel');
let bodyParser = require('body-parser');
let expressJWT = require('express-jwt');
let jwt = require('jsonwebtoken');

//Mongoose instance connection url connection
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/Tododb', { useMongoClient: true });

const ONE_YEAR = 31536000000;

httpsApp.use(helmet.hsts({
	maxAge: ONE_YEAR,
	includeSubdomains: true,
	force: true
}));

let cipher = ['ECDHE-ECDSA-AES256-GCM-SHA384',
		'ECDHE-RSA-AES256-GCM-SHA384',
		'ECDHE-RSA-AES256-CBC-SHA384',
		'ECDHE-RSA-AES256-CBC-SHA256',
		'ECDHE-ECDSA-AES128-GCM-SHA256',
		'ECDHE-RSA-AES128-GCM-SHA256',
		'DHE-RSA-AES128-GCM-SHA256',
		'DHE-RSA-AES256-GCM-SHA384',
		'!aNULL',
		'!MD5',
		'!DSS'].join(':');

//Connecting to mongoose
httpApp.use(bodyParser.urlencoded({ extended: true }));
httpsApp.use(bodyParser.urlencoded({ extended: true }));

httpApp.use(bodyParser.json());
httpsApp.use(bodyParser.json());

let publicKey = fs.readFileSync('/home/blove/public_key.pem','utf8');

httpsApp.use(expressJWT({ secret: publicKey }).unless({ path: ['/login1', '/login2', '/register']}));

let routes = require('./api/routes/todoListRoutes');
routes(httpsApp);
routes(httpApp);

httpApp.get("*", function(req, res, next){
	res.redirect('https://' + req.headers.host + req.url);
});

httpsApp.get('/', function(req, res){
	res.send('You are in the right place.');
});

let options = {
	key: fs.readFileSync('/etc/letsencrypt/live/end2endchat.me-0001/privkey.pem'),
	cert: fs.readFileSync('/etc/letsencrypt/live/end2endchat.me-0001/fullchain.pem'),
	ciphers: cipher
};

http.createServer(httpApp).listen(8080);
https.createServer(options, httpsApp).listen(3000);

console.log('Running server on ports 8080 and 3000');
