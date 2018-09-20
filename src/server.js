const serverless = require('serverless-http');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const cookieParser = require('cookie-parser');

const routes = require('./routes');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors());

app.use('/', routes);

module.exports.handler = serverless(app, {
	request: function(request, event, context) {
		request.context = event.requestContext;
	}
});