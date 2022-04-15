import AMQPController from "../../../library/index";


export default class RabbitMQ {
  async insertInQueue(
    exchangeName,
    queueName,
    replyQueue,
    topicKey,
    routingKey,
    replyKey,
    requestKey,
    exchangeType,
    queueType,
    queueData
  ) {
    return await AMQPController.insertInQueue(
      exchangeName,
      queueName,
      replyQueue,
      topicKey,
      routingKey,
      replyKey,
      requestKey,
      exchangeType,
      queueType,
      queueData
    );
  }

    async initializeRabbitMQListener() {
        return true;
    }

  async queueListener(queueData, data) {
    data = JSON.parse(data);
    console.log("queueData - data --> ", data);
    if (!data) return;
    try {
    } catch (err) {
      console.log("queueListener catch", err);
    }
  }
}
