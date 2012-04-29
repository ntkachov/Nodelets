#Node Pages Server
This small file will set up a quick server that will server pages in the ./np/ directory. 

###Usage: 
Copy Server.js into a directory of your site. then run

	node Server.js

It will probably complain about not finding a folder called "np"

	mkdir np

will create the folder where you should put all your node pages. 

###Node page structure.
Every node page should export a function called run. This function will be called when your page is requested. This line MUST be included into your page or the server will not be able to call your page:
	
	exports.run = function(data, res)


Params:

	data [string]:
		this is the raw string of data that was passed into your function.

	res [function (string)]:
		This is the responce function. 
		When your page is done processing data, call this function and pass in a string. This string will be sent back to the client.


Sample node pages:

helloworld.js
	
	exports.run = function(data, res){
		res("Hello World");
	}

echoServer.js
	
	exports.run = function(data, res){
		res(data);
	};

