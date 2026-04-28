import { Test, TestingModule } from '@nestjs/testing';
import { StellarService } from './stellar.service';
import * as StellarSdk from '@stellar/stellar-sdk';

jest.mock('@stellar/stellar-sdk', () => {
  const original = jest.requireActual('@stellar/stellar-sdk');
  return {
    ...original,
    Horizon: {
      Server: jest.fn().mockImplementation(() => ({
        loadAccount: jest.fn(),
        submitTransaction: jest.fn(),
      })),
    },
  };
});

describe('StellarService', () => {
  let service: StellarService;
  let mockServer: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StellarService],
    }).compile();

    service = module.get<StellarService>(StellarService);
    mockServer = service.getServer();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAccount', () => {
    it('should return account details on success (happy path)', async () => {
      const accountId = 'GA...';
      const mockAccount = { id: accountId, sequence: '123' };
      mockServer.loadAccount.mockResolvedValue(mockAccount);

      const result = await service.getAccount(accountId);

      expect(mockServer.loadAccount).toHaveBeenCalledWith(accountId);
      expect(result).toEqual(mockAccount);
    });

    it('should throw error on failure (failure path)', async () => {
      const accountId = 'GA...';
      const error = new Error('Account not found');
      mockServer.loadAccount.mockRejectedValue(error);

      await expect(service.getAccount(accountId)).rejects.toThrow(
        'Account not found',
      );
      expect(mockServer.loadAccount).toHaveBeenCalledWith(accountId);
    });
  });

  describe('submitTransaction', () => {
    it('should submit transaction successfully (happy path)', async () => {
      const mockTx = {} as StellarSdk.Transaction;
      const mockResponse = { successful: true, hash: 'hash123' };
      mockServer.submitTransaction.mockResolvedValue(mockResponse);

      const result = await service.submitTransaction(mockTx);

      expect(mockServer.submitTransaction).toHaveBeenCalledWith(mockTx);
      expect(result).toEqual(mockResponse);
    });

    it('should throw error on failure (failure path)', async () => {
      const mockTx = {} as StellarSdk.Transaction;
      const error = new Error('Transaction failed');
      mockServer.submitTransaction.mockRejectedValue(error);

      await expect(service.submitTransaction(mockTx)).rejects.toThrow(
        'Transaction failed',
      );
      expect(mockServer.submitTransaction).toHaveBeenCalledWith(mockTx);
    });
  });
});
