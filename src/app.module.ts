import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { LancamentosModule } from './modules/lancamentos/lancamentos.module';
import { User } from './modules/users/entities/user.entity';
import { Tenant } from './modules/tenants/entities/tenant.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.local',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false,
        ssl: {
          rejectUnauthorized: false,
        },
        // Connection pooling and retry configuration
        poolSize: 10,
        retryAttempts: 5,
        retryDelay: 3000,
        keepConnectionAlive: true,
        // Additional connection options
        extra: {
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
          statement_timeout: 30000,
          family: 4, // Force IPv4 (Supabase IPv6 compatibility issue)
        },
      }),
    }),
    TypeOrmModule.forFeature([User, Tenant]),
    UsersModule,
    AuthModule,
    TenantsModule,
    LancamentosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
