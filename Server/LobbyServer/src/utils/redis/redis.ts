import exp from 'constants';
import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

export const redis = new Redis({
    host: 'ec2-13-125-252-89.ap-northeast-2.compute.amazonaws.com',
    port: 6379,
  });