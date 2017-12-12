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
let ws = require('ws');

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

httpsApp.use(expressJWT({ secret: publicKey }).unless({ path: ['/login1', '/login2', '/register', '/pubKey', 'request']}));

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
const httpsServer = https.createServer(options, httpsApp).listen(3000);

console.log('Running server on ports 8080 and 3000');

const wss = new ws.Server({ server: httpsServer });

wss.on('request', function(request){
	console.log((new Date()) + ' Connection from origin ' + request.origin + '.');

	let connection = request.accept(null, request.origin);

	let index = clients.push(connection) - 1;
	let userName = false;
	let userColer = false;

	console.log((new Date()) + ' Connection accepted.');

	//send back chat history
	if (history.length > 0) {
		connection.sendUTF(
			JSON.stringify({ type: 'history', data: history} ));
	}

	//user sent some message
	connection.on('message', function connection(ws, req) {
		if (message.type === 'utf8'){
			//fist message send it their username
			if(userName ===false) {
				//remember username
				userName = htmlEntities(message.utf8Data);

				//get and send a random color back to the user
				userColor = colors.shift();
				connection.sendUTF(
					JSON.stringify({ type:'color', data: userColor }));
				console.log((new Date()) + 'User is known as: ' + userName + ' with ' + userColor + ' color.');
			}else {
				//broadcast message
				console.log((new Date()) + 'Received message from ' + userName + ': ' + message.utf8Data);

				//history of all sent messages
				let obj = {
					time: (new Date()).getTime(),
					text: htmlEntities(message.utf8Data),
					user: userName,
					color: userColor
				};
				history.push(obj);
				history = history.slice(-100);

				//broadcasting to all connected clients
				let json = JSON.stringify({ type:'message', data: obj });
				for (let i=0; i<clients.length; i++) {
					clients[i].sendUTF(json);
				}
			}
		}
	});

	//user disconnected
	connection.on('close', function(connection){
		if(userName !== false && userColor !== false) {
			console.log((new Data()) + ' Peer ' + connection.remoteAddress + ' disconnected.');

			//remove user
			clients.splice(index, 1);
			//make users color available for reuse
			colors.push(userColor);
		}
	});
});
