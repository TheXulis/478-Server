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

let userMap = {};
let chatMap = {};
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

	ws.on('message', function incoming(message){
		let object = JSON.parse(message);
		console.log("Received message. Type: " + object.type);


		//If this is the first message received from this socket, initialize the variables
		if(object.type === "initializeUser"){
			console.log("Initializing websocket for: " + object.user);
			ws.username = object.user;
			userMap[object.user] = ws;
		} else if(object.type === "requestChat"){

			//What is the name of the other user in the chat
			console.log(object.receiver);

			let data = JSON.stringify({type:"requestingChat", from:ws.username });
			let connection = userMap[object.receiver];

			console.log(connection);

			connection.send(data);
			//Find the id of who we wish to send to
			//console.log(userMap[object.receiver]);
			//console.log(userMap);

		} else if(object.type === "initializeChatFirst"){

			//Set some attributes of this websocket
			ws.username = object.user;
			ws.othername = object.other;
			ws.thischat = object.user + object.other;
			ws.otherchat = object.other + object.user;

			//Add chat to the chatMap
			chatMap[ws.thischat] = ws;

			//Send info to start the chat at the other end
			let info = JSON.stringify({type:"chat:acceptedSecond", other: object.user, user: object.other});
			let connection = userMap[object.other];
			connection.send(info);

		} else if(object.type === "initializeChatSecond"){

			//Set some attributes of this websocket
			ws.username = object.user;
			ws.othername = object.other;
			ws.thischat = object.user + object.other;
			ws.otherchat = object.other + object.user;

			//Add chat to the chatMap
			chatMap[ws.thischat] = ws;

		} else if(object.type === "message"){
			console.log(object);
			//Send the message to the other connection
			let connection = chatMap[ws.otherchat]

			let data = JSON.stringify({message:object.message});
			connection.send(data);

		} else {
			console.log("error");
		}


	});

	ws.on('close', function close(){
		console.log("User: " + ws.username + " just disconnected");
	});

});
