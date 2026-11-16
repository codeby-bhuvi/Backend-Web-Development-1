'use strict';


const Redis = require('ioredis');


// Create Redis instance
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  lazyConnect: true
});


// Get cached data
async function cacheGet(key) {
  try {
    const data = await redis.get(key);


    if (data === null) return null;


    return JSON.parse(data);
  } catch (error) {
    console.error('Redis cacheGet error:', error);
    return null;
  }
}


// Store cached data
async function cacheSet(key, data, ttlSeconds) {
  try {
    await redis.set(key, JSON.stringify(data), 'EX', ttlSeconds);
  } catch (error) {
    console.error('Redis cacheSet error:', error);
  }
}


// Delete cached data
async function cacheDel(key) {
  try {
    await redis.del(key);
  } catch (error) {
    console.error('Redis cacheDel error:', error);
  }
}


module.exports = { cacheGet, cacheSet, cacheDel };