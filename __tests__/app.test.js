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
  await agent.post('/api/v1/users/sessions').send({ email, password });
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

  it('DELETE logs out a user', async () => {
    await request(app).post('/api/v1/users').send(mockUser);
    await request(app).post('/api/v1/users/sessions').send(mockUser);
    const res = await request(app).delete('/api/v1/users/sessions');
    expect(res.status).toEqual(200);
    expect(res.body.message).toBe('Successfully signed out!');
  });

  it('Returns a list of secrets for logged in user', async () => {
    const [agent] = await registerAndLogin();
    const res = await agent.get('/api/v1/secrets');

    expect(res.body).toEqual([
      {
        id: '1',
        title: 'First Secret',
        description: 'Shhhhh dont tell anyone',
        created_at: expect.any(String),
      },
    ]);
  });
  afterAll(() => {
    pool.end();
  });
});
