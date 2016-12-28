var xmpp = require('simple-xmpp');
var config = require('config');

var user = config.get('jabber.user');
var pass = config.get('jabber.password');
var host = "conference.goonfleet.com";
var port = 5222;

console.log("Connecting to " + host + ":" + port);



xmpp.on('error', function(err) {
        console.error(err);
});

xmpp.on('online', function(data) {
    console.log('Connected: ' + data.jid.user);
});

xmpp.on('chat', function(from, message) {
    console.log(from + ": " + message);
    if(from == "directorbot@goonfleet.com")
    {
      console.log("PING!");
    }
});

xmpp.connect({
            jid: user,
            password: pass,
            host: host,
            port: port
});
