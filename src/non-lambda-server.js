const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const cookieParser = require('cookie-parser');
const userId = require('uuid/v4')();
const routes = require('./routes');

console.log('Generated user id is: ' + userId);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors());

app.use('*', function(req, res, next) {
	req.context = {
		identity : {
			cognitoIdentityId : userId
		}
	}

	next();
});

app.use('/', routes);


app.listen(4000, () => console.log('Example app listening on port 4000!'));