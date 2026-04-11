const Redis = require('ioredis');

const redisOptions = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  retryStrategy: (times) => {
    // Graceful degradation: stop retrying after 5 attempts if redis is down
    if (times > 5) {
      console.warn('⚠️ [Redis] Max retries reached. Cache is degrading gracefully.');
      return null;
    }
    const delay = Math.min(times * 100, 3000);
    return delay;
  },
  maxRetriesPerRequest: 1,
};

const redis = new Redis(redisOptions);

let isConnected = false;

redis.on('connect', () => {
  isConnected = true;
  console.log('✅ [Redis] Connected exactly to cache instance');
});

redis.on('error', (err) => {
  if (isConnected) {
    console.warn(`[Redis] Connection dropped: ${err.message}. System falling back to raw DB queries.`);
    isConnected = false;
  }
});

/**
 * Cache-Aside Pattern (FAANG Grade)
 * Automatically fetches from Redis. If miss or failure, fetches from source (DB) and sets Redis asynchronously.
 * 
 * @param {string} key Redis Cache Key
 * @param {number} ttlSecs Time to live in seconds
 * @param {function} fetchFunction Lambda returning authoritative data
 * @returns {Promise<any>}
 */
const withCache = async (key, ttlSecs, fetchFunction) => {
  if (!isConnected) {
    return await fetchFunction();
  }

  try {
    const cachedData = await redis.get(key);
    if (cachedData) {
      // Cache HIT
      return JSON.parse(cachedData);
    }
  } catch (err) {
    console.error(`[Redis] Read error on ${key}:`, err.message);
  }

  // Cache MISS or Redis Error -> Execute source operation
  const freshData = await fetchFunction();

  if (isConnected && freshData) {
    // Asynchronously populate cache so we don't block the response
    redis.set(key, JSON.stringify(freshData), 'EX', ttlSecs).catch((err) => {
      console.error(`[Redis] Write error on ${key}:`, err.message);
    });
  }

  return freshData;
};

/**
 * Atomic cache invalidator using namespace matching
 */
const invalidateCache = async (pattern) => {
  if (!isConnected) return;
  try {
    const stream = redis.scanStream({
      match: pattern,
      count: 100,
    });
    
    stream.on('data', async (keys) => {
      if (keys.length) {
        const pipeline = redis.pipeline();
        keys.forEach((key) => pipeline.del(key));
        await pipeline.exec();
      }
    });

  } catch (err) {
    console.error(`[Redis] Invalidation error on ${pattern}:`, err.message);
  }
};

module.exports = {
  redis,
  withCache,
  invalidateCache,
};
