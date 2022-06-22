const pool = require('../lib/utils/pool');
const setup = require('../data/setup');
const request = require('supertest');
const app = require('../lib/app');
const UserService = require('../lib/services/UserService');

//Dummy user for testing
const mockUser = {
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  password: '12345',
};

const registerAndLogin = async (userProps = {}) => {
  const password = userProps.password ?? mockUser.password;

  //Create an "agent" that gives us the ability
  //to store cookies between requests in a test
  const agent = request.agent(app);

  //Create user to sign in
  const user = await UserService.create({ ...mockUser, ...userProps });

  //then sign in
  const { email } = user;
  await agent.post('/api/v1/users/sessions').setEncoding({ email, password });
  return [agent, user];
};

describe('top-secrets routes', () => {
  beforeEach(() => {
    return setup(pool);
  });
  it('POST creates a new user', async () => {
    const res = await request(app).post('/api/v1/users').send(mockUser);

    expect(res.body.email).toBe('test@example.com');
  });

  it('POST logs in a user', async () => {
    await request(app).post('/api/v1/users').send(mockUser);
    const res = await request(app)
      .post('/api/v1/users/sessions')
      .send({ email: 'test@example.com', password: '12345' });
    expect(res.status).toEqual(200);
  });
  afterAll(() => {
    pool.end();
  });
});
