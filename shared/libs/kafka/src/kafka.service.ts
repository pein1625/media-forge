import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { MediaEvent } from '@media-forge/types';
import { randomUUID } from 'crypto';

@Injectable()
export class KafkaService {
  private readonly logger = new Logger(KafkaService.name);

  constructor(@Inject('KAFKA_CLIENT') private kafkaClient: ClientKafka) {}

  /**
   * Emit an event to a Kafka topic
   * @param topic Topic name to publish to
   * @param message Message payload
   */
  async emit(topic: string, message: any): Promise<void> {
    try {
      this.kafkaClient.emit(topic, message);
      this.logger.debug(`Event emitted to topic: ${topic}`);
    } catch (error) {
      this.logger.error(`Failed to emit event to topic ${topic}`, error);
      throw error;
    }
  }

  /**
   * Build a standard MediaEvent envelope
   * @param eventType Type of event
   * @param userId User ID initiating the event
   * @param payload Event payload
   * @param source Source service name (optional)
   * @returns MediaEvent envelope
   */
  buildEvent<T>(
    eventType: string,
    userId: string,
    payload: T,
    source: string = 'media-forge',
  ): MediaEvent<T> {
    return {
      eventId: randomUUID(),
      eventType,
      timestamp: new Date(),
      version: '1.0.0',
      source,
      correlationId: randomUUID(),
      userId,
      payload,
    };
  }
}
