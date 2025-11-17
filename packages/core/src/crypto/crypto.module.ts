import { Module } from '@nestjs/common';
import { CryptorService } from './cryptor.service';
import { EnvironmentModule } from '../environment/environment.module';

@Module({
    imports: [EnvironmentModule], // CryptorService needs EnvironmentService
    providers: [CryptorService],
    exports: [CryptorService],
})
export class CryptoModule { }
