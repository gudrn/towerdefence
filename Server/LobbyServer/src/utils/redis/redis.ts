import exp from 'constants';
import Redis from 'ioredis';

export const redis = new Redis(
  'redis://ec2-13-125-207-67.ap-northeast-2.compute.amazonaws.com:6379',
);
