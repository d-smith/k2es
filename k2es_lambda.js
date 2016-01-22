
var AWS = require('aws-sdk');
var path = require('path');

/* == Globals == */
var esDomain = {
    region: 'us-east-1',
    endpoint: 'search-xavi1-rpdbu5n5wl2jd3get34cnrqs4q.us-east-1.es.amazonaws.com',
    index: 'xaviindex',
    doctype: 'xavilog'
};
var endpoint = new AWS.Endpoint(esDomain.endpoint);
/*
 * The AWS credentials are picked up from the environment.
 * They belong to the IAM role assigned to the Lambda function.
 * Since the ES requests are signed using these credentials,
 * make sure to apply a policy that allows ES domain operations
 * to the role.
 */
var creds = new AWS.EnvironmentCredentials('AWS');


/* Lambda "main": Execution begins here */
exports.handler = function(event, context) {
    //console.log(JSON.stringify(event, null, '  '));
    event.Records.forEach(function(record) {

        var payload = new Buffer(record.kinesis.data, 'base64').toString('ascii');
        //console.log('Decoded payload:', payload);

        if(couldBeJSON(payload)) {
          console.log('jsonPayload assumed');

          var jsonPart = stripPrefixFromJSON(payload);
          //console.log('jsonPart: ' + jsonPart);

          postToES(jsonPart, context);
        } else {
          console.log('Not json - skip record');
        }
    });

    context.succeed();
}

function couldBeJSON(s) {
  return s.indexOf("{") >= 0
}

function stripPrefixFromJSON(s) {
  idx = s.indexOf('{');
  if(idx > 0)
    return s.substring(idx);
  else
    return s;
}


/*
 * Post the given document to Elasticsearch
 */
function postToES(doc, context) {
    var req = new AWS.HttpRequest(endpoint);

    req.method = 'POST';
    req.path = path.join('/', esDomain.index, esDomain.doctype);
    req.region = esDomain.region;
    req.headers['presigned-expires'] = false;
    req.headers['Host'] = endpoint.host;
    req.body = doc;

    var signer = new AWS.Signers.V4(req , 'es');  // es: service code
    signer.addAuthorization(creds, new Date());

    var send = new AWS.NodeHttpClient();
    send.handleRequest(req, null, function(httpResp) {
        var respBody = '';
        httpResp.on('data', function (chunk) {
            respBody += chunk;
        });
        httpResp.on('end', function (chunk) {
            console.log('Response: ' + respBody);
            context.succeed('Lambda added document ' + doc);
        });
    }, function(err) {
        console.log('Error: ' + err);
        context.fail('Lambda failed with error ' + err);
    });
}
