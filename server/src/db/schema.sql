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
  completion_line VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  INDEX idx_quests_user (user_id)
);

-- Add scheduling columns to databases created before these optional fields existed.
ALTER TABLE quests ADD COLUMN IF NOT EXISTS scheduled_date VARCHAR(10) NULL;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS start_time VARCHAR(5) NULL;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS end_time VARCHAR(5) NULL;
-- Companion line shown on completion; NULL for quests created before this column existed.
ALTER TABLE quests ADD COLUMN IF NOT EXISTS completion_line VARCHAR(255) NULL;

CREATE TABLE IF NOT EXISTS items (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  type VARCHAR(32) NOT NULL,
  price INT NOT NULL,
  asset VARCHAR(255) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

-- Shop order; added for databases created before the column existed.
ALTER TABLE items ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;

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

-- Shop catalog. Keep in sync with CATALOG in src/services/shopService.ts (same IDs, values, and order).
-- Seed rows go through a temporary table so this list exists once: existing rows are updated,
-- new rows inserted, and rows no longer in the catalog removed unless a player owns them
-- (owned leftovers are kept and reported by db:init; see src/scripts/initDb.ts).
DROP TEMPORARY TABLE IF EXISTS seed_items;
CREATE TEMPORARY TABLE seed_items (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  type VARCHAR(32) NOT NULL,
  price INT NOT NULL,
  asset VARCHAR(255) NOT NULL,
  sort_order INT NOT NULL
);
INSERT INTO seed_items (id, name, type, price, asset, sort_order) VALUES
  ('plant-red-pot', 'Plant (Red Pot)', 'furniture', 20, 'plant-red-pot.png', 1),
  ('plant-brown-pot', 'Plant (Brown Pot)', 'furniture', 20, 'plant-brown-pot.png', 2),
  ('plant-blue-pot', 'Plant (Blue Pot)', 'furniture', 20, 'plant-blue-pot.png', 3),
  ('plant-grey-pot', 'Plant (Grey Pot)', 'furniture', 20, 'plant-grey-pot.png', 4),
  ('lamp-black', 'Black Lamp', 'furniture', 50, 'lamp-black.png', 5),
  ('lamp-gold', 'Gold Lamp', 'furniture', 50, 'lamp-gold.png', 6),
  ('lamp-copper', 'Copper Lamp', 'furniture', 50, 'lamp-copper.png', 7),
  ('lamp-grey', 'Grey Lamp', 'furniture', 50, 'lamp-grey.png', 8),
  ('lamp-tan-black', 'Tan Shade Black Lamp', 'furniture', 50, 'lamp-tan-black.png', 9),
  ('lamp-tan-gold', 'Tan Shade Gold Lamp', 'furniture', 50, 'lamp-tan-gold.png', 10),
  ('lamp-tan-copper', 'Tan Shade Copper Lamp', 'furniture', 50, 'lamp-tan-copper.png', 11),
  ('lamp-tan-grey', 'Tan Shade Grey Lamp', 'furniture', 50, 'lamp-tan-grey.png', 12),
  ('chair-cream', 'Cream Chair', 'furniture', 40, 'chair-cream.png', 13),
  ('chair-caramel', 'Caramel Chair', 'furniture', 40, 'chair-caramel.png', 14),
  ('chair-dark-brown', 'Dark Brown Chair', 'furniture', 40, 'chair-dark-brown.png', 15),
  ('chair-chestnut', 'Chestnut Chair', 'furniture', 40, 'chair-chestnut.png', 16),
  ('chair-grey', 'Grey Chair', 'furniture', 40, 'chair-grey.png', 17),
  ('chair-black', 'Black Chair', 'furniture', 40, 'chair-black.png', 18),
  ('chair-green', 'Green Chair', 'furniture', 40, 'chair-green.png', 19),
  ('chair-teal', 'Teal Chair', 'furniture', 40, 'chair-teal.png', 20),
  ('chair-pink', 'Pink Chair', 'furniture', 40, 'chair-pink.png', 21),
  ('sofa-beige', 'Beige Sofa', 'furniture', 100, 'sofa-beige.png', 22),
  ('sofa-slate', 'Slate Sofa', 'furniture', 100, 'sofa-slate.png', 23),
  ('sofa-charcoal', 'Charcoal Sofa', 'furniture', 100, 'sofa-charcoal.png', 24),
  ('sofa-brown', 'Brown Sofa', 'furniture', 100, 'sofa-brown.png', 25),
  ('sofa-red', 'Red Sofa', 'furniture', 100, 'sofa-red.png', 26),
  ('sofa-coral', 'Coral Sofa', 'furniture', 100, 'sofa-coral.png', 27),
  ('sofa-orange', 'Orange Sofa', 'furniture', 100, 'sofa-orange.png', 28),
  ('sofa-green', 'Green Sofa', 'furniture', 100, 'sofa-green.png', 29),
  ('sofa-teal', 'Teal Sofa', 'furniture', 100, 'sofa-teal.png', 30),
  ('sofa-navy', 'Navy Sofa', 'furniture', 100, 'sofa-navy.png', 31),
  ('sofa-purple', 'Purple Sofa', 'furniture', 100, 'sofa-purple.png', 32),
  ('sofa-rosewood', 'Rosewood Sofa', 'furniture', 100, 'sofa-rosewood.png', 33),
  ('pet-bowl', 'Food Bowl', 'furniture', 20, 'pet-bowl.png', 34),
  ('pet-scratcher', 'Scratching Post', 'furniture', 40, 'pet-scratcher.png', 35),
  ('pet-bed', 'Cozy Cat Bed', 'furniture', 60, 'pet-bed.png', 36),
  ('pet-tree', 'Cat Tree', 'furniture', 120, 'pet-tree.png', 37),
  ('flowers-red-pot', 'Flowers (Red Pot)', 'garden', 30, 'flowers-red-pot.png', 38),
  ('flowers-brown-pot', 'Flowers (Brown Pot)', 'garden', 30, 'flowers-brown-pot.png', 39),
  ('flowers-blue-pot', 'Flowers (Blue Pot)', 'garden', 30, 'flowers-blue-pot.png', 40),
  ('tree-red-pot', 'Tree (Red Pot)', 'garden', 50, 'tree-red-pot.png', 41),
  ('tree-brown-pot', 'Tree (Brown Pot)', 'garden', 50, 'tree-brown-pot.png', 42),
  ('tree-blue-pot', 'Tree (Blue Pot)', 'garden', 50, 'tree-blue-pot.png', 43),
  ('tree-grey-pot', 'Tree (Grey Pot)', 'garden', 50, 'tree-grey-pot.png', 44),
  ('bench-cream', 'Cream Bench', 'garden', 80, 'bench-cream.png', 45),
  ('bench-caramel', 'Caramel Bench', 'garden', 80, 'bench-caramel.png', 46),
  ('bench-dark-brown', 'Dark Brown Bench', 'garden', 80, 'bench-dark-brown.png', 47),
  ('bench-chestnut', 'Chestnut Bench', 'garden', 80, 'bench-chestnut.png', 48),
  ('bench-grey', 'Grey Bench', 'garden', 80, 'bench-grey.png', 49),
  ('bench-black', 'Black Bench', 'garden', 80, 'bench-black.png', 50),
  ('bench-green', 'Green Bench', 'garden', 80, 'bench-green.png', 51),
  ('bench-teal', 'Teal Bench', 'garden', 80, 'bench-teal.png', 52),
  ('bench-pink', 'Pink Bench', 'garden', 80, 'bench-pink.png', 53),
  ('fountain', 'Fountain', 'garden', 150, 'fountain.png', 54),
  ('hat', 'Hat', 'clothing', 40, 'player-hat.png', 55),
  ('hoodie', 'Hoodie', 'clothing', 60, 'player-hoodie.png', 56),
  ('sneakers', 'Sneakers', 'clothing', 80, 'player-sneakers.png', 57);
INSERT INTO items (id, name, type, price, asset, sort_order)
  SELECT id, name, type, price, asset, sort_order FROM seed_items
  ON DUPLICATE KEY UPDATE name = VALUES(name), type = VALUES(type), price = VALUES(price), asset = VALUES(asset), sort_order = VALUES(sort_order);
DELETE FROM items WHERE id NOT IN (SELECT id FROM seed_items) AND id NOT IN (SELECT item_id FROM user_items);
DROP TEMPORARY TABLE seed_items;

INSERT IGNORE INTO players (id, level, xp, coins, outfit) VALUES ('player-1', 1, 0, 0, 'default');
