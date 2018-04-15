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

## MAC MySQL installation and set-up
1. download image from https://dev.mysql.com/downloads/mysql/  (btw, you do not need to sign-up)
2. follow wizard to install and get temp. password, in my case it was - host: root@localhost, pwd: TzqA)a9BRD7P
3. start mysql (you can use MySQL preference pane)
4. `cd /usr/local/mysql/bin`
5. `./mysql -u root -p` and pass password you got during installation
6. create reset tmp pwd, create new user, pwd and db:
	+ `ALTER USER 'root'@'localhost' IDENTIFIED BY 'MyNewPass';`
	+ `GRANT ALL PRIVILEGES ON *.* TO 'slaw'@'localhost' IDENTIFIED BY 'slaw123';`
	+ `\q` to exit and `./mysql -u slaw -p` to enter client again
	+ `CREATE DATABASE call_center;`
7. run sql scripts with data: `mysql -u slaw -p call_center < '<path-to-script>/create_init_records.sql'`
8. also its useful to get better tool to interact with your db, I'm using e.g. dbvizualizer