var express = require('express');		// include express.js
	//io1 = require('socket.io');				// include socket.io
	app = express();									// make an instance of express.js
 	server = app.listen(8001, "0.0.0.0", function() {
    console.log('Server listening on port ' + server.address().port);
});
 	server2 = app.listen(8000, "0.0.0.0", function() {
    console.log('Server listening on port ' + server2.address().port);
});				// start a server with the express instance
	socketServer = require('socket.io').listen(server);
	clientServer = require('socket.io').listen(server2);
		 			// make a socket server using the express server

	

	
var count1=0,count2 = 0,count3=0;
var chunk = '';
// function showPortOpen() {
//    console.log('port open. Data rate: ' + myPort.options.baudRate);
// }
//initializae the anchor readings 
var distances = {r1: -1000.00, r2: -1000.00, r3: -1000.00};
var count=0;
//manage serial port events

function sendSerialData(sensorSocket) {
	sensorSocket.on('sensor_data', function(data){
		chunk += data.toString();
		if(chunk.indexOf('\n')!=-1){
			n_index = chunk.indexOf('\n');
			var idata = chunk.substring(0, n_index+1);
			chunk = chunk.substring(n_index+1);
			console.log("New data event: "+idata);
			var device_added = "ranging init; 1 device added ! ->  short:",
				device_removed = "delete inactive device: ";
			
			if(idata.indexOf(device_added)!=-1){
				var device_id = idata.substr(idata.indexOf(':')+1, 4);
				if(device_id==="ACE1"){
					if(count1==0)	count1++; 
				} else if(device_id==="ACE2"){
					if(count2==0)	count2++;
				} else {
					if(count3==0)	count3++;
				}

				//count++;
				//distances[data.subString(device_added.length())] = ;
			}
			if(idata.indexOf(device_removed)!=-1){
				var deleted_device_id = idata.substr(idata.indexOf(':')+2, 4);
				if(deleted_device_id==="ACE1"){
					if(count1>0)	count1--; 
				} else if(deleted_device_id==="ACE2"){
					if(count2>0)	count2--;
				} else {
					if(count3>0)	count3--;
				}
				//count--;
				//distances.splice(devices.indexOf(data.subString(device_removed.length())));
			}
			if(idata.indexOf('from')!=-1) {
		         var anchor_name = idata.substr(idata.indexOf(':')+2, 4);
		         var value = Number(idata.substring(idata.lastIndexOf(':')+2, idata.lastIndexOf('m')-1));
		         if(anchor_name === "ACE1") {
		            distances.r1 = value;
		            console.log("FROM ACE1: "+distances.r1);
		         } else if(anchor_name === "ACE2") {
		            distances.r2 = value;
		            console.log("FROM ACE2: "+distances.r2);
		         } else {
		            distances.r3 = value;
		            console.log("FROM ACE3: "+distances.r3);
	         	 }
	  		}
		}

	});
}
function showError(error){
		console.log('Serial port error: ' + error);
	}

//open the socket for continuos communication:							
clientServer.on('connection', openSocket);
socketServer.on('connection', sendSerialData);



//  set up server and socketServer listener functions:
app.use(express.static(__dirname + '/node_modules'));
app.use(express.static(__dirname + '/pathfinding-bower-0.4.18'));					

app.get('/', function(req, res, next) {  
    res.sendFile(__dirname + '/gridLine.html');
});
app.get('/demo', function(req, res, next) {  
    res.sendFile(__dirname + '/engr325.html');
});






//setup the socket event listeners

function openSocket(socket){
	//console.log('Client connected...');
	//console.log('new user address: ' + socket.handshake.address);
	// send something to the web client with the data:
	//socket.emit('message', 'Hello, ' + socket.handshake.address);

	// this function runs if there's input from the client:
	/*socket.on('message', function(data) {
		myPort.write(data);							// send the data to the serial device
	});*/

		//trilateration module, triggered every second by the socket connection:
	setInterval(function(){
		if(count1==1 && count2==1 && count3==1){		    
			console.log("r1:"+" "+distances.r1+" "+"r2: "+" "+distances.r2+" "+"r3: "+" "+distances.r3);           
            var child = require('child_process').spawnSync('java', ['-jar', 'Trilateration.jar', distances.r1, distances.r2, distances.r3, process.argv[2], process.argv[3], process.argv[4]]);
  			child.stdout.on('data', function(data) {
    			console.log("calculated location: "+data.toString());
			    var coord = data.toString();
			    var X = Number(coord.substring(0,coord.indexOf(',')));
			    var Y = Number(coord.substring(coord.indexOf(',')+2));
			    var roundedX = 1.0/4*Math.floor(4*X);
			    var roundedY = 1.0/4*Math.floor(4*Y);
			    var loc = { x : X, y : Y};
			    console.log("parsed location: "+typeof(loc.x)+ ": "+ loc.x+", "+ typeof(loc.y) +": "+loc.y);
			    console.log("sending co-ords");
			    	socket.emit('location', loc);
			    //console.log(roundedX + " "+roundedY);			    			    
			  });
			  child.stderr.on("data", function (data) {
			    console.log("Error from trilateration: "+data.toString());
			  });           
          	}
          else{
              	console.log("One or more anchors are not online")
			    } }, 1000);
		
}