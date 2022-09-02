# Skouppi = Scope + Skuuppi
## Topic based news collector for Serverless framework in AWS.

The application searches through predefined rss-feeds for news items and collects all the news items relevant to the topic defined when creating an AWS Comprehend custom classification model.
This model can be switched in the program as needed.
This program is designed to run on AWS serverless resources (Lambda, s3 etc.) and can be deployed with the serverless framework template.

### RSS-Lambda
A Lambda function that collects news items from various RSS feeds according to a predefined feed.json and launches a custom AWS Comprehend classification job.


### Dataggregator-Lambda
A Lambda function to classify news items according to previously launched AWS Comprehend classification job and to produce and a file with the relevant news items.


### Api-Lambda
A Lambda function for running API access service providing the final output, the topical news items


### Example
Example of JSON output (one news item) from API

![image](https://user-images.githubusercontent.com/56840557/188080471-6b0c3e9b-c4a2-4ec2-9084-6f4caeabf9c2.png)

