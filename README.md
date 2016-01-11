# K2ES - Kinesis to Elasticsearch

[ ![Codeship Status for xtraclabs/k2es](https://codeship.com/projects/6f55b420-9ad9-0133-32d1-56295786b896/status?branch=master)](https://codeship.com/projects/126606)

Use Lambda to move Kinesis data to elastic search. Use in conjunction with [Loghose](https://github.com/xtraclabs/loghose)

This code was taken from https://github.com/awslabs/amazon-elasticsearch-lambda-samples

## Packaging

To package for upload to amazon lambda, CD into the directory containing
k2es_lambda.js,then:

<pre>
npm install aws-sdk
npm install path
zip -r k2es.zip *
</pre>

## Lamba Config

You can now upload the zip when creating the Lambda function. In the Lambda configuration,
the Handler is k2es_lambda.handler. Create a kinesis execution role, and attach
a policy allowing access to the elasticsearch stream.

<pre>
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Action": [
                "es:*"
            ],
            "Effect": "Allow",
            "Resource": "arn:aws:es:us-east-1:930295567417:domain/xavi1/*"
        }
    ]
}
</pre>

The inline components of the policy are created in the lambda setup when selecting
the kinesis execution role.

Note the appropriate Kinesis stream needs to be added as the event source.

## Elasticsearch Config

On the Elasticsearch config side, configure access to the Kibana dashboard
using the 'Allow access to the domain from specific IP(s)' and specify a CIDR
spec of allowed address ranges. Alternatively, you could leverage IAM and Cognito
as well to provide access to specific users or roles.

Beyond access management, the first time Kinana is accessed via the Kibana
endpoint associated with the domain, use xaviindx* as the index pattern, with
time as the time field. Note if you use a different index in the
k2es_lambda.js source, you would use the same value in the index setup.
