import { Test, TestingModule } from '@nestjs/testing';
import { ExchangesController } from './exchanges.controller';
import { ExchangesService } from './exchanges.service';

describe('ExchangesController', () => {
  let controller: ExchangesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExchangesController],
      providers: [ExchangesService],
    }).compile();

    controller = module.get<ExchangesController>(ExchangesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
