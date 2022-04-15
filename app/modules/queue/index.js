import BlManager from "./queueManager";

export default class RabbitMqController {
  async initializeRabbitMQListener() {
    return await new BlManager().initializeRabbitMQListener();
  }

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
    return await new BlManager().insertInQueue(
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
}
