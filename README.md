# **Implementation of dead-letter-exchange RabbitMQ**
![Diagram](https://res.cloudinary.com/xanhz/image/upload/v1677769928/diagrams/dead-letter-exchange.drawio_h4iudx.png)
## **Installation**
```
yarn install
docker build -t rabbitmq-xanhz .
sudo mkdir rabbitmq
sudo chmod -R 777 ./rabbitmq
```
## **Run**
- Start RabbitMQ:
```
docker-compose up -d rabbitmq
```
- Run publisher:
```
yarn start:publisher
```
- Run email-worker:
```
yarn start:email-worker
```
- Run error-worker:
```
yarn start:error-worker
```
- Run requeue-worker:
```
yarn start:requeue-worker
```
