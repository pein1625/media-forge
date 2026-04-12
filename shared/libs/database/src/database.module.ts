import {
  DynamicModule,
  Global,
  Module,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

export interface DatabaseConfig {
  url: string;
}

@Global()
@Module({})
export class DatabaseModule {
  static forRoot(config: DatabaseConfig): DynamicModule {
    const isDevelopment = process.env.NODE_ENV !== 'production';

    return {
      module: DatabaseModule,
      imports: [
        TypeOrmModule.forRootAsync({
          useFactory: async () => ({
            type: 'postgres',
            url: config.url,
            autoLoadEntities: true,
            synchronize: isDevelopment,
            logging: isDevelopment,
            ssl: !isDevelopment ? { rejectUnauthorized: false } : false,
          }),
        }),
      ],
      exports: [TypeOrmModule],
    };
  }
}
