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


### feed.json
```
{
  "feeds": [
    {
      "URL": "https://feeds.yle.fi/uutiset/v1/recent.rss?publisherIds=YLE_NEWS",
      "country": "Finland",
      "title": "Yle"
    }
  ]
}
    ```

### Example

![image](https://user-images.githubusercontent.com/56840557/188080164-815dc3c8-b4dc-41d5-8840-5638f9b519ba.png)
