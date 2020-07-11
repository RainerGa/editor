const WebSocket = require('ws');

module.exports = function(RED) {
	//must be same with register
    function SendKeysNode(config) {
        RED.nodes.createNode(this,config);
		// Node parameters
		this.browser = config.browser;
		this.xpath = config.xpath;
		this.text = config.text;
		this.clear = config.clear;
		this.waitvisible = config.waitvisible;
		this.waitbefore = config.waitbefore;
		this.waitafter = config.waitafter;

		var ws;
        var node = this;
		var flowContext = this.context().flow;
        node.on('input', function(msg,send,done) {
			node.status({fill:"blue",shape:"ring",text:"Typing"});
			//prepare action parameters
			var t = {user:"admin",module:"WebDriver",action:"SENDKEYS",browser:"",xpath:"",text:"",clear:false,waitvisible:false,waitbefore:500,waitafter:500};
			t.browser = node.browser;
			t.xpath = node.xpath;
			t.text = node.text;
			if (node.clear != "")
			    t.clear = node.clear;
			if (node.waitvisible != "")
			    t.waitvisible = node.waitvisible;
			if (node.waitbefore != "")
			    t.waitbefore = parseInt(node.waitbefore);
			if (node.waitafter != "")
			    t.waitafter = parseInt(node.waitafter);
			ws = new WebSocket('wss://127.0.0.1:7000',{
			  rejectUnauthorized: false
			});
			
			ws.onopen = () => {
				msg.payload = "Typing "+node.text;
				ws.send(JSON.stringify(t));
			}
			
			ws.on('message', function incoming(data){
				var d = JSON.parse(data);
				msg.payload = d.status;
				if (d.status=="SUCCESS") {
					node.send(msg);
					node.status({fill:"green",shape:"ring",text:"done"});
				} else {
				    node.status({fill:"red",shape:"ring",text:"error"});
					msg.payload = d.value;
				    node.error(new Error(msg.payload));
				    done(new Error(msg.payload))
				}
			});
			
			ws.on('error', function(err) {
				console.error("WebSocket error:", err);
				node.status({fill:"red",shape:"ring",text:"error"});
				if (err.code == "ECONNREFUSED")
					node.error(new Error("Proxy server is not running"));
				else 
					node.error(new Error(err));
				done(new Error(err))
			});
        });
		node.on('close', function(done) {
			done();
		});
	}
    RED.nodes.registerType("send-keys",SendKeysNode);
}