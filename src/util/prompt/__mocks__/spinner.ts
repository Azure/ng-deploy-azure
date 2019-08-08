console.log('using mock spinner');
export const spinner = {
  start: jest.fn(),
  stop: jest.fn(),
  succeed: jest.fn()
};
