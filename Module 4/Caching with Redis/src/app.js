'use strict';


// ─── GIVEN FILE — modify only to add caching (do not remove existing code) ───
// This file sets up the Express app and two routes.
// Your job: import cacheGet/cacheSet/cacheDel from ./cache and wire up:
//   GET /feed  → cache-aside with 60s TTL and X-Cache header
//   POST /posts → cacheDel after db.createPost()


require('dotenv').config();


const express = require('express');
const db = require('./db');


// Import Redis cache functions
const { cacheGet, cacheSet, cacheDel } = require('./cache');


const app = express();
app.use(express.json());


const FEED_KEY = 'feed:trending';
const FEED_TTL = 60;   // seconds


app.get('/health', (req, res) => res.json({ ok: true }));


// GET /feed — cache-aside implementation
app.get('/feed', async (req, res) => {
  try {
    const t0 = Date.now();


    // 1. Check cache first
    const cachedPosts = await cacheGet(FEED_KEY);


    if (cachedPosts !== null) {
      res.set('X-Cache', 'HIT');
      console.log(`[feed] HIT ${Date.now() - t0}ms`);
      return res.json(cachedPosts);
    }


    // 2. Cache miss: fetch from database
    const posts = await db.getTrendingPosts();


    // 3. Store result in cache for 60 seconds
    await cacheSet(FEED_KEY, posts, FEED_TTL);


    // 4. Set MISS header
    res.set('X-Cache', 'MISS');
    console.log(`[feed] DB  ${Date.now() - t0}ms`);


    return res.json(posts);


  } catch (err) {
    console.error('[feed] error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// POST /posts — creates a new post and invalidates cache
app.post('/posts', async (req, res) => {
  try {
    const post = await db.createPost(req.body);


    // Invalidate cached feed after creating a post
    await cacheDel(FEED_KEY);


    res.status(201).json(post);
  } catch (err) {
    console.error('[posts] error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


const PORT = process.env.PORT || 3000;


if (require.main === module) {
  app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
}

module.exports = { app };