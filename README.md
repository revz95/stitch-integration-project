# stitch-integration-project

This repository creates a very simple subscription backend API to integrate with Stitch: 
https://stitch.money/docs/quick-start/ The goal is just to gain a high-level of understanding of how the integration works.

## Livy
Apache Livy is a service that enables simple interaction with a Spark cluster over a REST interface. 
It enables easy submission of Spark jobs or snippets of Spark code, synchronous or asynchronous result retrieval.

Livy is currently deployed in the `stage-aqueduct-analytics` namespace. 

## What is this repository for?
Integrate with the following features: 
* Generate Client and User tokens 
* Create an InstantPay 
* Create a LinkPay
* Issue a Refund

### How to get started
`npm run start:dev `

**Please Note:** There is no error handling so I assume everything works as intended. A lot of the features are only for the purpose of learning how the product work, so this is not an accurate representation of a subscription API.