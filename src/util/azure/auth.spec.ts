import { loginToAzureWithCI } from './auth';

const loggerMock = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  fatal: jest.fn(),
};

const AuthResponseMock = {
  credentials: {},
  subscriptions: [],
};

jest.mock('conf');
jest.mock('@azure/ms-rest-nodeauth', () => {
  return {
    loginWithServicePrincipalSecretWithAuthResponse: jest.fn(() => {
      return AuthResponseMock;
    }),
  };
});

describe('Auth', () => {
  afterAll(() => {
    jest.clearAllMocks();
  });

  describe('calling loginToAzureWithCI', () => {
    it('should throw if CLIENT_ID is not provided', () => {
      expect(loginToAzureWithCI(loggerMock)).rejects.toThrow('CLIENT_ID is required in CI mode');
    });
    it('should throw if CLIENT_SECRET is not provided', () => {
      process.env.CLIENT_ID = 'fake';
      expect(loginToAzureWithCI(loggerMock)).rejects.toThrow('CLIENT_SECRET is required in CI mode');
    });
    it('should throw if TENANT_ID is not provided', () => {
      process.env.CLIENT_ID = 'fake';
      process.env.CLIENT_SECRET = 'fake';
      expect(loginToAzureWithCI(loggerMock)).rejects.toThrow('TENANT_ID is required in CI mode');
    });
    it('should throw if AZURE_SUBSCRIPTION_ID is not provided', () => {
      process.env.CLIENT_ID = 'fake';
      process.env.CLIENT_SECRET = 'fake';
      process.env.TENANT_ID = 'fake';
      expect(loginToAzureWithCI(loggerMock)).rejects.toThrow('AZURE_SUBSCRIPTION_ID is required in CI mode');
    });

    it('should resolves if all env variables are provided', async () => {
      process.env.CLIENT_ID = 'fake';
      process.env.CLIENT_SECRET = 'fake';
      process.env.TENANT_ID = 'fake';
      process.env.AZURE_SUBSCRIPTION_ID = 'fake';
      expect(await loginToAzureWithCI(loggerMock)).toBe(AuthResponseMock);
    });
  });
});
