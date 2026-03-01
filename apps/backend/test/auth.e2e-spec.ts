import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  const users: Array<{
    id: number;
    email: string;
    password: string;
    name: string;
    refreshTokenHash: string | null;
    createdAt: Date;
    updatedAt: Date;
  }> = [];

  const prismaMock = {
    user: {
      findUnique: jest.fn(async (args: any) => {
        if (args?.where?.email) {
          return users.find((user) => user.email === args.where.email) ?? null;
        }

        if (args?.where?.id) {
          const user = users.find((item) => item.id === args.where.id);
          if (!user) {
            return null;
          }

          if (args.select) {
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            };
          }

          return user;
        }

        return null;
      }),
      create: jest.fn(async (args: any) => {
        const now = new Date();
        const created = {
          id: users.length + 1,
          email: args.data.email,
          password: args.data.password,
          name: args.data.name,
          refreshTokenHash: null,
          createdAt: now,
          updatedAt: now,
        };
        users.push(created);
        return created;
      }),
      update: jest.fn(async (args: any) => {
        const user = users.find((item) => item.id === args.where.id);
        if (!user) {
          throw new Error('User not found');
        }

        if (Object.prototype.hasOwnProperty.call(args.data, 'refreshTokenHash')) {
          user.refreshTokenHash = args.data.refreshTokenHash;
        }
        user.updatedAt = new Date();

        return user;
      }),
    },
  };

  beforeEach(async () => {
    users.length = 0;
    jest.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.use(cookieParser());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('signup -> login -> refresh -> me success flow', async () => {
    const agent = request.agent(app.getHttpServer());

    const signupResponse = await agent
      .post('/auth/signup')
      .send({ email: 'test@example.com', password: '123456', name: 'tester' })
      .expect(201);

    expect(signupResponse.body.user.email).toBe('test@example.com');
    expect(signupResponse.body.accessToken).toBeDefined();
    expect(signupResponse.body.refreshToken).toBeUndefined();

    const loginResponse = await agent
      .post('/auth/login')
      .send({ email: 'test@example.com', password: '123456' })
      .expect(200);

    expect(loginResponse.body.accessToken).toBeDefined();
    expect(loginResponse.body.refreshToken).toBeUndefined();

    const refreshResponse = await agent.post('/auth/refresh').expect(200);

    expect(refreshResponse.body.accessToken).toBeDefined();
    expect(refreshResponse.body.refreshToken).toBeUndefined();

    const meResponse = await agent
      .get('/auth/me')
      .set('Authorization', `Bearer ${refreshResponse.body.accessToken}`)
      .expect(200);

    expect(meResponse.body.email).toBe('test@example.com');
    expect(meResponse.body.name).toBe('tester');
  });

  it('signup with duplicate email returns 409', async () => {
    await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email: 'dup@example.com', password: '123456', name: 'dup' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email: 'dup@example.com', password: '123456', name: 'dup2' })
      .expect(409);
  });

  it('refresh without cookie returns 401', async () => {
    await request(app.getHttpServer()).post('/auth/refresh').expect(401);
  });

  it('refresh after logout returns 401', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/auth/signup')
      .send({ email: 'logout@example.com', password: '123456', name: 'logout' })
      .expect(201);

    const loginResponse = await agent
      .post('/auth/login')
      .send({ email: 'logout@example.com', password: '123456' })
      .expect(200);

    await agent
      .post('/auth/logout')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
      .expect(200);

    await agent.post('/auth/refresh').expect(401);
  });

  it('me without token returns 401', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);
  });
});
