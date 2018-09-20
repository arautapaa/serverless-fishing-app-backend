const AWS = require('aws-sdk');
const ses = new AWS.SES({
   region: "eu-west-1"
});


const actions = {
	sendEmail : function(messageObject) {
		ses.sendEmail(messageObject, (err, data) => {
			if(err) {
				console.log(JSON.stringify(err));
			} else {
				console.log("EMAIL SEND")
			}
		})
	}
}

module.exports = actions;