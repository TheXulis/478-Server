let express = require('express');
let httpApp = express();
let httpsApp = express();
let http = require('http');
let https = require('https');
let fs = require('fs');
let helmet = require('helmet');
let mongoose = require('mongoose');
let Users = require('./api/models/todoListModel');
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

httpsApp.use(expressJWT({ secret: publicKey }).unless({ path: ['/login1', '/login2', '/register', '/pubKey']}));

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

let connectedUsers = [];
const wss = new ws.Server({ server: httpsServer,

	//Verify that this user has a valid jwt token
	verifyClient: function(info){

		return jwt.verify(info.req.headers.authorization, publicKey, {complete:true}, function(err, decoded){
                        console.log("Verifying Token . . .");

                        if(!decoded){
                                console.log('Invalid token');
                                ws.send('Invalid token');

                                //return false for invalid token
                                return false;
                        } else {
                                let dToken = jwt.decode(info.req.headers.authorization, {complete:true});
                                console.log("Valid Token from " + dToken.payload.username);
                                console.log('From a valid token bearer');
				return true;
                        }
		});
	}
 });

wss.on('connection', function connection(ws, req){
	connectedUsers.push(ws);

	ws.on('message', function incoming(message){
		console.log('Received message: ' + message);

		let object = JSON.parse(message);
		console.log("json: "+object);
		console.log(object.type);

		//If this is the first message received from this socket, initialize the variables
		if(object.type === "initializeUser"){
			console.log("Initializing websocket for: " + object.user);
			ws.username = object.user;

		} else if(object.type === "initializeChat"){
			ws.sentBy = object.sender;
			ws.sendTo = object.receiver;

		} else if(object.type === "message"){
			console.log("Message being sent from " + ws.sendBy + " to " + ws.sendTo);
		}




		//I can add my own attributes to the socket connection like this
//		ws._ultron.id2 = 'bob';
//		console.log(ws._ultron);

		//This might be important for connections
		//ws._ultron.id = 'Bob';
		//console.log(ws._ultron.id);
	});

	ws.send("Please don't disconnect on me.")
});
