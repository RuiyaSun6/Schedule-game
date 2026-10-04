-- LifeQuest TiDB schema. Run with: npm run db:init

CREATE TABLE IF NOT EXISTS players (
  id VARCHAR(64) PRIMARY KEY,
  level INT NOT NULL DEFAULT 1,
  xp INT NOT NULL DEFAULT 0,
  coins INT NOT NULL DEFAULT 0,
  outfit VARCHAR(64) NOT NULL DEFAULT 'default',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quests (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(32) NOT NULL,
  difficulty VARCHAR(16) NOT NULL,
  estimated_minutes INT NOT NULL,
  xp_reward INT NOT NULL,
  coin_reward INT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  scheduled_date VARCHAR(10) NULL,
  start_time VARCHAR(5) NULL,
  end_time VARCHAR(5) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  INDEX idx_quests_user (user_id)
);

-- Add scheduling columns to databases created before these optional fields existed.
ALTER TABLE quests ADD COLUMN IF NOT EXISTS scheduled_date VARCHAR(10) NULL;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS start_time VARCHAR(5) NULL;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS end_time VARCHAR(5) NULL;

CREATE TABLE IF NOT EXISTS items (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  type VARCHAR(32) NOT NULL,
  price INT NOT NULL,
  asset VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS user_items (
  user_id VARCHAR(64) NOT NULL,
  item_id VARCHAR(64) NOT NULL,
  purchased_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, item_id)
);

-- Optional: Quest Memory (TiDB Vector Search). 768 = Gemini embedding size we request.
CREATE TABLE IF NOT EXISTS quest_memory (
  quest_id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(32) NOT NULL,
  difficulty VARCHAR(16) NOT NULL,
  estimated_minutes INT NOT NULL,
  embedding VECTOR(768) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_memory_user (user_id)
);

INSERT IGNORE INTO items (id, name, type, price, asset) VALUES
  ('plant', 'Plant', 'furniture', 20, 'plant.png'),
  ('chair', 'Chair', 'furniture', 40, 'chair.png'),
  ('lamp', 'Lamp', 'furniture', 50, 'lamp.png'),
  ('sofa', 'Sofa', 'furniture', 100, 'sofa.png'),
  ('flowers', 'Flowers', 'garden', 30, 'flowers.png'),
  ('tree', 'Tree', 'garden', 50, 'tree.png'),
  ('bench', 'Bench', 'garden', 80, 'bench.png'),
  ('fountain', 'Fountain', 'garden', 150, 'fountain.png'),
  ('hat', 'Hat', 'clothing', 40, 'player-hat.png'),
  ('hoodie', 'Hoodie', 'clothing', 60, 'player-hoodie.png'),
  ('sneakers', 'Sneakers', 'clothing', 80, 'player-sneakers.png');

INSERT IGNORE INTO players (id, level, xp, coins, outfit) VALUES ('player-1', 1, 0, 0, 'default');
