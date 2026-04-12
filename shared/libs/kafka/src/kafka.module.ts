import { DynamicModule, Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { KafkaService } from './kafka.service';

export interface KafkaConfig {
  brokers: string[];
  clientId: string;
  groupId: string;
}

@Global()
@Module({})
export class KafkaModule {
  static forRoot(config: KafkaConfig): DynamicModule {
    return {
      module: KafkaModule,
      imports: [
        ClientsModule.register([
          {
            name: 'KAFKA_CLIENT',
            transport: Transport.KAFKA,
            options: {
              client: {
                brokers: config.brokers,
                clientId: config.clientId,
              },
              consumer: {
                groupId: config.groupId,
              },
            },
          },
        ]),
      ],
      providers: [KafkaService],
      exports: [KafkaService, ClientsModule],
    };
  }
}
