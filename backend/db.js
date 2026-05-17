import initSqlJs from 'sql.js'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_PATH = join(__dirname, 'data', 'gallery.db')
const DB_DIR = dirname(DB_PATH)

let db = null
let saveTimer = null

export async function initDB() {
  if (!existsSync(DB_DIR)) {
    mkdirSync(DB_DIR, { recursive: true })
  }

  const SQL = await initSqlJs()

  if (existsSync(DB_PATH)) {
    const buffer = readFileSync(DB_PATH)
    db = new SQL.Database(buffer)
    console.log(`[db] 从 ${DB_PATH} 加载数据库`)
  } else {
    db = new SQL.Database()
    console.log('[db] 创建新数据库')
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      username TEXT PRIMARY KEY,
      name TEXT DEFAULT '',
      avatar TEXT DEFAULT '',
      bio TEXT DEFAULT '',
      media_count TEXT DEFAULT '0',
      tweets_count TEXT DEFAULT '0',
      following TEXT DEFAULT '0',
      followers TEXT DEFAULT '0',
      is_following INTEGER DEFAULT 1,
      added_at TEXT DEFAULT '',
      updated_at TEXT DEFAULT ''
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      tweet_id TEXT NOT NULL,
      tweet_url TEXT DEFAULT '',
      type TEXT DEFAULT 'photo',
      url TEXT DEFAULT '',
      preview_url TEXT DEFAULT '',
      text TEXT DEFAULT '',
      date TEXT DEFAULT '',
      likes TEXT DEFAULT '',
      retweets TEXT DEFAULT '',
      replies TEXT DEFAULT '',
      views TEXT DEFAULT '',
      duration TEXT DEFAULT '',
      author TEXT NOT NULL,
      created_at TEXT DEFAULT ''
    )
  `)

  db.run(`CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_posts_date ON posts(date)`)

  // 迁移：tweets列改为media_count，新增tweets_count
  try {
    const cols = db.prepare("PRAGMA table_info(users)")
    const colNames = []
    while (cols.step()) colNames.push(cols.getAsObject().name)
    cols.free()
    if (colNames.includes('tweets') && !colNames.includes('media_count')) {
      db.run('ALTER TABLE users RENAME COLUMN tweets TO media_count')
      console.log('[db] 迁移: tweets → media_count')
    }
    if (!colNames.includes('tweets_count')) {
      db.run("ALTER TABLE users ADD COLUMN tweets_count TEXT DEFAULT '0'")
      console.log('[db] 迁移: 新增 tweets_count')
    }
    if (!colNames.includes('is_following')) {
      db.run("ALTER TABLE users ADD COLUMN is_following INTEGER DEFAULT 1")
      console.log('[db] 迁移: 新增 is_following')
    }
    if (!colNames.includes('added_at')) {
      db.run("ALTER TABLE users ADD COLUMN added_at TEXT DEFAULT ''")
      console.log('[db] 迁移: 新增 added_at')
    }
  } catch (e) {
    console.log('[db] 迁移跳过:', e.message)
  }

  // 迁移：从following表同步数据到users表
  try {
    const followingExists = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='following'")
    if (followingExists.length > 0) {
      const followingRows = db.prepare('SELECT username, added_at FROM following')
      while (followingRows.step()) {
        const row = followingRows.getAsObject()
        const existing = db.prepare('SELECT username FROM users WHERE username = ?')
        existing.bind([row.username])
        if (existing.step()) {
          db.run('UPDATE users SET is_following = 1, added_at = ? WHERE username = ?', [row.added_at || '', row.username])
        } else {
          db.run("INSERT OR IGNORE INTO users (username, name, is_following, added_at) VALUES (?, ?, 1, ?)", [row.username, row.username, row.added_at || ''])
        }
        existing.free()
      }
      followingRows.free()
      console.log('[db] 迁移: following表数据已同步到users表')
    }
  } catch (e) {
    console.log('[db] following迁移跳过:', e.message)
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS username_map (
      username TEXT PRIMARY KEY,
      name TEXT DEFAULT ''
    )
  `)

  saveDB()
  return db
}

export function getDB() {
  return db
}

export function saveDB() {
  if (!db) return
  const data = db.export()
  const buffer = Buffer.from(data)
  writeFileSync(DB_PATH, buffer)
}

function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveDB()
    console.log('[db] 数据已保存')
  }, 2000)
}

export function upsertUser(user) {
  const existing = getUser(user.username)
  if (existing) {
    db.run(`
      UPDATE users SET name = ?, avatar = ?, bio = ?, media_count = ?, tweets_count = ?, 
        following = ?, followers = ?, updated_at = datetime('now')
      WHERE username = ?
    `, [user.name || existing.name || '', user.avatar || existing.avatar || '', user.bio || existing.bio || '',
        user.media_count || existing.media_count || '0', user.tweets_count || existing.tweets_count || '0',
        user.following || existing.following || '0', user.followers || existing.followers || '0',
        user.username])
  } else {
    db.run(`
      INSERT INTO users (username, name, avatar, bio, media_count, tweets_count, following, followers, is_following, added_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [user.username, user.name || '', user.avatar || '', user.bio || '',
        user.media_count || '0', user.tweets_count || '0', user.following || '0', user.followers || '0',
        user.is_following !== undefined ? user.is_following : 1])
  }
  scheduleSave()
}

export function upsertUsers(users) {
  for (const user of users) {
    upsertUser(user)
  }
}

export function getUser(username) {
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?')
  stmt.bind([username])
  if (stmt.step()) {
    const row = stmt.getAsObject()
    stmt.free()
    return row
  }
  stmt.free()
  return null
}

export function getAllUsers() {
  const results = []
  const stmt = db.prepare('SELECT * FROM users')
  while (stmt.step()) {
    results.push(stmt.getAsObject())
  }
  stmt.free()
  return results
}

export function upsertPost(post) {
  db.run(`
    INSERT OR REPLACE INTO posts (id, tweet_id, tweet_url, type, url, preview_url, text, date, likes, retweets, replies, views, duration, author, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `, [post.id, post.tweetId, post.tweetUrl || '', post.type, post.url || '',
      post.previewUrl || '', post.text || '', post.date || '',
      post.likes || '', post.retweets || '', post.replies || '',
      post.views || '', post.duration || '', post.author])
  scheduleSave()
}

export function upsertPosts(posts) {
  for (const post of posts) {
    upsertPost(post)
  }
}

export function getPostsByUsernames(usernames) {
  const placeholders = usernames.map(() => '?').join(',')
  const results = []
  const stmt = db.prepare(`SELECT * FROM posts WHERE author IN (${placeholders})`)
  stmt.bind(usernames)
  while (stmt.step()) {
    const row = stmt.getAsObject()
    results.push(dbRowToPost(row))
  }
  stmt.free()
  results.sort((a, b) => {
    const parseDate = (s) => new Date(s.replace(/·/g, ''))
    return parseDate(b.date) - parseDate(a.date)
  })
  return results
}

export function deletePostsByUser(username) {
  db.run('DELETE FROM posts WHERE author = ?', [username])
  scheduleSave()
}

export function deleteUser(username) {
  db.run('DELETE FROM users WHERE username = ?', [username])
  db.run('DELETE FROM posts WHERE author = ?', [username])
  scheduleSave()
}

function dbRowToPost(row) {
  return {
    id: row.id,
    tweetId: row.tweet_id,
    tweetUrl: row.tweet_url,
    type: row.type,
    url: row.url,
    previewUrl: row.preview_url,
    text: row.text,
    date: row.date,
    likes: row.likes,
    retweets: row.retweets,
    replies: row.replies,
    views: row.views,
    duration: row.duration,
    author: row.author,
  }
}

export function dbRowToUser(row) {
  return {
    username: row.username,
    name: row.name,
    avatar: row.avatar,
    bio: row.bio,
    media_count: row.media_count,
    tweets_count: row.tweets_count,
    following: row.following,
    followers: row.followers,
    is_following: row.is_following,
    added_at: row.added_at,
  }
}

export function getAllUsersInfo() {
  const results = []
  const stmt = db.prepare('SELECT * FROM users')
  while (stmt.step()) {
    results.push(dbRowToUser(stmt.getAsObject()))
  }
  stmt.free()
  return results
}

export function getUsersByUsernames(usernames) {
  const placeholders = usernames.map(() => '?').join(',')
  const results = []
  const stmt = db.prepare(`SELECT * FROM users WHERE username IN (${placeholders})`)
  stmt.bind(usernames)
  while (stmt.step()) {
    results.push(dbRowToUser(stmt.getAsObject()))
  }
  stmt.free()
  return results
}

export function getPostsCountByUser(username) {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM posts WHERE author = ?')
  stmt.bind([username])
  if (stmt.step()) {
    const count = stmt.getAsObject().count
    stmt.free()
    return count
  }
  stmt.free()
  return 0
}

export function upsertUsernameMap(username, name) {
  if (!username || !name) return
  db.run('INSERT OR REPLACE INTO username_map (username, name) VALUES (?, ?)', [username, name])
  scheduleSave()
}

export function upsertUsernameMapBatch(entries) {
  for (const { username, name } of entries) {
    if (username && name) {
      db.run('INSERT OR REPLACE INTO username_map (username, name) VALUES (?, ?)', [username, name])
    }
  }
  scheduleSave()
}

export function resolveUsernames(usernames) {
  const result = {}
  const placeholders = usernames.map(() => '?').join(',')
  const stmt = db.prepare(`SELECT username, name FROM username_map WHERE username IN (${placeholders})`)
  stmt.bind(usernames)
  while (stmt.step()) {
    const row = stmt.getAsObject()
    result[row.username] = row.name
  }
  stmt.free()
  return result
}

export function getFollowingList() {
  const results = []
  const stmt = db.prepare('SELECT username FROM users WHERE is_following = 1 ORDER BY added_at DESC')
  while (stmt.step()) {
    results.push(stmt.getAsObject().username)
  }
  stmt.free()
  return results
}

export function addFollowing(username) {
  const existing = getUser(username)
  if (existing) {
    db.run('UPDATE users SET is_following = 1, added_at = datetime("now") WHERE username = ?', [username])
  } else {
    db.run("INSERT OR IGNORE INTO users (username, name, is_following, added_at) VALUES (?, ?, 1, datetime('now'))", [username, username])
  }
  scheduleSave()
}

export function addFollowingBatch(usernames) {
  for (const username of usernames) {
    const existing = getUser(username)
    if (existing) {
      db.run('UPDATE users SET is_following = 1, added_at = datetime("now") WHERE username = ?', [username])
    } else {
      db.run("INSERT OR IGNORE INTO users (username, name, is_following, added_at) VALUES (?, ?, 1, datetime('now'))", [username, username])
    }
  }
  scheduleSave()
}

export function removeFollowing(username) {
  db.run('UPDATE users SET is_following = 0 WHERE username = ?', [username])
  scheduleSave()
}

export function cleanupNonFollowing(followingUsernames) {
  const followingSet = new Set(followingUsernames)
  let deletedPosts = 0
  let deletedUsers = 0

  const allUsers = db.exec("SELECT username FROM users WHERE is_following = 0")
  if (allUsers.length > 0) {
    for (const row of allUsers[0].values) {
      db.run('DELETE FROM posts WHERE author = ?', [row[0]])
      db.run('DELETE FROM users WHERE username = ? AND is_following = 0', [row[0]])
      deletedPosts++
      deletedUsers++
    }
  }

  if (deletedPosts > 0 || deletedUsers > 0) {
    scheduleSave()
    console.log(`[db] 清理非关注用户: 删除 ${deletedPosts} 条帖子, ${deletedUsers} 个用户`)
  }

  return { deletedPosts, deletedUsers }
}
