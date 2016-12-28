var xmpp = require('simple-xmpp');
var request = require('request');
var config = require('config');

var user = config.get('jabber.user');
var pass = config.get('jabber.password');
var host = "goonfleet.com";
var port = 5222;

xmpp.connect({
            jid: user,
            password: password,
            host: host,
            port: port
});

xmpp.on('error', function(err) {
        console.error(err);
});

xmpp.on('online', function(data) {
    console.log('Connected: ' + data.jid.user);
});
