# call_center_monitoring

This is still in development

## MAC NODE.JS AND NECESSERY PACKAGES INSTALLATION
1. get LTS version from https://nodejs.org/en/download/ and install it
2. you can check where node.js was installed with `which node` or check it's version with `node --version`
3. copy or create package.js to proper directory and run `npm install` there


## MAC KAFKA INSTALLATION
1. `brew install kafka` will install kafka (in my case it was in `/usr/local/etc/kafka`)
2. go to kafka directory and start zookeeper server in background with proper log directory: 
   `zookeeper-server-start zookeeper.properties > ~/zookeeper.log &`
3. check if it works correctly: `telnet localhost 2181` and then `ruok` (which stands for "are you ok?").
   service should reply "imok" and close telnet session
   note: if you're on High Sierra or higher you may be missing telnet. simply: `brew install telnet`
4. start up our Kafka message broker: `kafka-server-start server.properties > ~/kafka_server.log &`
--- testing if kafka is working fine ---
5. create test topic: `kafka-topics --create --zookeeper localhost:2181 --replication-factor 1 --partitions 1 --topic test`
6. list topics: `kafka-topics --list --zookeeper localhost:2181`
6. start console producer and write some msgs: `kafka-console-producer --broker-list localhost:9092 --topic test`
7. in different terminal start consuming msgs:
   `kafka-console-consumer --bootstrap-server localhost:9092 --topic test --from-beginning`