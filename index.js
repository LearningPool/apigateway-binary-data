'use strict';

const  nodemailer =require('nodemailer');
const sgTransport =require('nodemailer-sendgrid-transport');
const PDFDocument =require('pdfkit');
const fs =require('fs');

var AWS = require('aws-sdk'),
    region = "eu-west-1",
    secretName = "SENDGRID_API_KEY",
    secret;
    
var client = new AWS.SecretsManager({
    region: region
});

exports.handler = (event, context, callback) => {
    
client.getSecretValue({SecretId: secretName}, function(err, data) {
    if (err) {
        if (err.code === 'DecryptionFailureException')
            // Secrets Manager can't decrypt the protected secret text using the provided KMS key.
            // Deal with the exception here, and/or rethrow at your discretion.
            throw err;
        else if (err.code === 'InternalServiceErrorException')
            // An error occurred on the server side.
            // Deal with the exception here, and/or rethrow at your discretion.
            throw err;
        else if (err.code === 'InvalidParameterException')
            // You provided an invalid value for a parameter.
            // Deal with the exception here, and/or rethrow at your discretion.
            throw err;
        else if (err.code === 'InvalidRequestException')
            // You provided a parameter value that is not valid for the current state of the resource.
            // Deal with the exception here, and/or rethrow at your discretion.
            throw err;
        else if (err.code === 'ResourceNotFoundException')
            // We can't find the resource that you asked for.
            // Deal with the exception here, and/or rethrow at your discretion.
            throw err;
    }
    else {
        // Decrypts secret using the associated KMS CMK.
        // Depending on whether the secret is a string or binary, one of these fields will be populated.
        if ('SecretString' in data) {
            const parsed = JSON.parse(data.SecretString);
            //console.log('P: ' + parsed.SENDGRID_API_KEY);
            secret = parsed;
            console.log('P: ' + secret.SENDGRID_API_KEY);
            ProcessEvent(event, context, callback);
           
        } 
    }
    // Your code goes here. 
});
};

function ProcessEvent(event, context, callback){
  
  const data = JSON.stringify(event);
  console.log('Data: '+ data);
  console.log('BODY' + event.body);
  //let buff = new Buffer(data, 'base64');
  //let text = buff.toString('binary');
  //fs.writeFileSync('/tmp/YOUR-CERTIFICATE.pdf', buff);
  //console.log('BASE64 to PDF: /tmp/YOUR-CERTIFICATE.pdf');
  //console.log('Base64 converted to ASCII'+ text);

  //console.log('MULTI JSON: ' + JSON.parse(data.body));

  console.log('SEC: ' + secret.SENDGRID_API_KEY);
  //const email = event.actor['account']['name'];
  const doc = new PDFDocument;
  doc.fontSize(20)
   .text('test', 100, 100);
  doc.end();
  const mailOptions = {
      to: 'dana.doherty@learningpool.com',
      from: 'danaoherty639@outlook.com',
      subject: 'Course Completed',
      html: '<b>Please find your Certificate</b>',
      attachments: [
        {   
            filename: 'Certificate.pdf',
            content: event.body,//new Buffer(event.body, 'base64'), //new Buffer('hello world!','binary'),
            //contentType: 'application/pdf'
        }]
  };
  
  const transporter = nodemailer.createTransport(sgTransport({
      auth: {
          api_key: secret.SENDGRID_API_KEY
      }
  }));

  transporter.sendMail(mailOptions, (err, res)=>{
    if(err){
        
        console.log(err);
    }
    console.log(res);
  });
  const responseheaders = {
    'Content-Type': 'application/pdf',
    // Required for CORS support to work
    'Access-Control-Allow-Origin': '*',  
    // Required for cookies, authorization headers with HTTPS
    'Access-Control-Allow-Credentials': true
  }
  let response = {
    "statusCode": 200,
    "headers": responseheaders,
    "body": event.body,
    "isBase64Encoded": false
    
 }
 callback(null, response);
}
