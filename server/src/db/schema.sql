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
  stackable BOOLEAN NOT NULL DEFAULT FALSE,
  max_quantity INT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

-- Shop order; added for databases created before the column existed.
ALTER TABLE items ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;
-- Stackable items (farm) can be owned many times; see user_items.quantity.
ALTER TABLE items ADD COLUMN IF NOT EXISTS stackable BOOLEAN NOT NULL DEFAULT FALSE;
-- Most copies of a stackable item one player may own (e.g. 5 chickens); NULL = no limit.
ALTER TABLE items ADD COLUMN IF NOT EXISTS max_quantity INT NULL;

CREATE TABLE IF NOT EXISTS user_items (
  user_id VARCHAR(64) NOT NULL,
  item_id VARCHAR(64) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  purchased_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, item_id)
);

-- Habits are separate from quests. The date key is UTC (YYYY-MM-DD); one check-in per habit/day.
CREATE TABLE IF NOT EXISTS habits (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description VARCHAR(200) NOT NULL,
  period VARCHAR(16) NOT NULL,
  target_count INT NOT NULL,
  created_date VARCHAR(10) NOT NULL,
  INDEX idx_habits_user (user_id)
);
CREATE TABLE IF NOT EXISTS habit_checkins (
  user_id VARCHAR(64) NOT NULL,
  habit_id VARCHAR(64) NOT NULL,
  completed_date VARCHAR(10) NOT NULL,
  PRIMARY KEY (habit_id, completed_date),
  INDEX idx_habit_checkins_user (user_id)
);
CREATE TABLE IF NOT EXISTS habit_claims (
  user_id VARCHAR(64) NOT NULL,
  reward_id VARCHAR(128) NOT NULL,
  claimed_date VARCHAR(10) NOT NULL,
  PRIMARY KEY (user_id, reward_id)
);

-- How many of an item the player owns (1 for regular items). Existing rows get 1.
ALTER TABLE user_items ADD COLUMN IF NOT EXISTS quantity INT NOT NULL DEFAULT 1;

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
  stackable BOOLEAN NOT NULL,
  max_quantity INT NULL,
  sort_order INT NOT NULL
);
INSERT INTO seed_items (id, name, type, price, asset, stackable, sort_order) VALUES
  ('plant-red-pot', 'Plant (Red Pot)', 'furniture', 20, 'plant-red-pot.png', FALSE, 1),
  ('plant-brown-pot', 'Plant (Brown Pot)', 'furniture', 20, 'plant-brown-pot.png', FALSE, 2),
  ('plant-blue-pot', 'Plant (Blue Pot)', 'furniture', 20, 'plant-blue-pot.png', FALSE, 3),
  ('plant-grey-pot', 'Plant (Grey Pot)', 'furniture', 20, 'plant-grey-pot.png', FALSE, 4),
  ('tree-red-pot', 'Tree (Red Pot)', 'furniture', 50, 'tree-red-pot.png', FALSE, 5),
  ('tree-brown-pot', 'Tree (Brown Pot)', 'furniture', 50, 'tree-brown-pot.png', FALSE, 6),
  ('tree-blue-pot', 'Tree (Blue Pot)', 'furniture', 50, 'tree-blue-pot.png', FALSE, 7),
  ('tree-grey-pot', 'Tree (Grey Pot)', 'furniture', 50, 'tree-grey-pot.png', FALSE, 8),
  ('lamp-black', 'Black Lamp', 'furniture', 50, 'lamp-black.png', FALSE, 9),
  ('lamp-gold', 'Gold Lamp', 'furniture', 50, 'lamp-gold.png', FALSE, 10),
  ('lamp-copper', 'Copper Lamp', 'furniture', 50, 'lamp-copper.png', FALSE, 11),
  ('lamp-grey', 'Grey Lamp', 'furniture', 50, 'lamp-grey.png', FALSE, 12),
  ('lamp-tan-black', 'Tan Shade Black Lamp', 'furniture', 50, 'lamp-tan-black.png', FALSE, 13),
  ('lamp-tan-gold', 'Tan Shade Gold Lamp', 'furniture', 50, 'lamp-tan-gold.png', FALSE, 14),
  ('lamp-tan-copper', 'Tan Shade Copper Lamp', 'furniture', 50, 'lamp-tan-copper.png', FALSE, 15),
  ('lamp-tan-grey', 'Tan Shade Grey Lamp', 'furniture', 50, 'lamp-tan-grey.png', FALSE, 16),
  ('chair-cream', 'Cream Chair', 'furniture', 40, 'chair-cream.png', FALSE, 17),
  ('chair-caramel', 'Caramel Chair', 'furniture', 40, 'chair-caramel.png', FALSE, 18),
  ('chair-dark-brown', 'Dark Brown Chair', 'furniture', 40, 'chair-dark-brown.png', FALSE, 19),
  ('chair-chestnut', 'Chestnut Chair', 'furniture', 40, 'chair-chestnut.png', FALSE, 20),
  ('chair-grey', 'Grey Chair', 'furniture', 40, 'chair-grey.png', FALSE, 21),
  ('chair-black', 'Black Chair', 'furniture', 40, 'chair-black.png', FALSE, 22),
  ('chair-green', 'Green Chair', 'furniture', 40, 'chair-green.png', FALSE, 23),
  ('chair-teal', 'Teal Chair', 'furniture', 40, 'chair-teal.png', FALSE, 24),
  ('chair-pink', 'Pink Chair', 'furniture', 40, 'chair-pink.png', FALSE, 25),
  ('sofa-beige', 'Beige Sofa', 'furniture', 100, 'sofa-beige.png', FALSE, 26),
  ('sofa-slate', 'Slate Sofa', 'furniture', 100, 'sofa-slate.png', FALSE, 27),
  ('sofa-charcoal', 'Charcoal Sofa', 'furniture', 100, 'sofa-charcoal.png', FALSE, 28),
  ('sofa-brown', 'Brown Sofa', 'furniture', 100, 'sofa-brown.png', FALSE, 29),
  ('sofa-red', 'Red Sofa', 'furniture', 100, 'sofa-red.png', FALSE, 30),
  ('sofa-coral', 'Coral Sofa', 'furniture', 100, 'sofa-coral.png', FALSE, 31),
  ('sofa-orange', 'Orange Sofa', 'furniture', 100, 'sofa-orange.png', FALSE, 32),
  ('sofa-green', 'Green Sofa', 'furniture', 100, 'sofa-green.png', FALSE, 33),
  ('sofa-teal', 'Teal Sofa', 'furniture', 100, 'sofa-teal.png', FALSE, 34),
  ('sofa-navy', 'Navy Sofa', 'furniture', 100, 'sofa-navy.png', FALSE, 35),
  ('sofa-purple', 'Purple Sofa', 'furniture', 100, 'sofa-purple.png', FALSE, 36),
  ('sofa-rosewood', 'Rosewood Sofa', 'furniture', 100, 'sofa-rosewood.png', FALSE, 37),
  ('pet-bowl', 'Food Bowl', 'furniture', 20, 'pet-bowl.png', FALSE, 38),
  ('pet-scratcher', 'Scratching Post', 'furniture', 40, 'pet-scratcher.png', FALSE, 39),
  ('pet-bed', 'Cozy Cat Bed', 'furniture', 60, 'pet-bed.png', FALSE, 40),
  ('pet-tree', 'Cat Tree', 'furniture', 120, 'pet-tree.png', FALSE, 41),
  ('wallpaper-sage-pinstripe', 'Sage Pinstripe', 'wallpaper', 30, 'wallpaper_01.png', FALSE, 42),
  ('wallpaper-navy-stripes', 'Navy Stripes', 'wallpaper', 30, 'wallpaper_02.png', FALSE, 43),
  ('wallpaper-butter-stripes', 'Butter Stripes', 'wallpaper', 30, 'wallpaper_03.png', FALSE, 44),
  ('wallpaper-walnut-panels', 'Walnut Panels', 'wallpaper', 30, 'wallpaper_04.png', FALSE, 45),
  ('wallpaper-blush-roses', 'Blush Roses', 'wallpaper', 30, 'wallpaper_05.png', FALSE, 46),
  ('wallpaper-crimson-roses', 'Crimson Roses', 'wallpaper', 30, 'wallpaper_06.png', FALSE, 47),
  ('wallpaper-orange-grove', 'Orange Grove', 'wallpaper', 30, 'wallpaper_07.png', FALSE, 48),
  ('wallpaper-bunny-moon', 'Bunny Moon', 'wallpaper', 30, 'wallpaper_08.png', FALSE, 49),
  ('wallpaper-snowflake-frost', 'Snowflake Frost', 'wallpaper', 30, 'wallpaper_09.png', FALSE, 50),
  ('wallpaper-starry-night', 'Starry Night', 'wallpaper', 30, 'wallpaper_10.png', FALSE, 51),
  ('crop-pumpkin', 'Pumpkin', 'farm', 12, 'crop-pumpkin.png', TRUE, 52),
  ('crop-carrot', 'Carrot', 'farm', 5, 'crop-carrot.png', TRUE, 53),
  ('crop-potato', 'Potato', 'farm', 5, 'crop-potato.png', TRUE, 54),
  ('crop-tomato', 'Tomato', 'farm', 8, 'crop-tomato.png', TRUE, 55),
  ('crop-pea', 'Peas', 'farm', 8, 'crop-pea.png', TRUE, 56),
  ('fence-wood', 'Wooden Fence', 'farm', 10, 'fence-wood.png', TRUE, 57),
  ('fence-post', 'Fence Post', 'farm', 5, 'fence-post.png', TRUE, 58),
  ('tree-birch', 'Birch Tree', 'farm', 20, 'tree-birch.png', TRUE, 59),
  ('tree-stump', 'Tree Stump', 'farm', 8, 'tree-stump.png', TRUE, 60),
  ('chest', 'Chest', 'farm', 15, 'chest.png', TRUE, 61),
  ('chest-open', 'Open Chest', 'farm', 15, 'chest-open.png', TRUE, 62),
  ('flowers-white', 'White Flowers', 'farm', 6, 'flowers-white.png', TRUE, 63),
  ('flowers-red', 'Red Tulips', 'farm', 6, 'flowers-red.png', TRUE, 64),
  ('rock', 'Rock', 'farm', 5, 'rock.png', TRUE, 65),
  ('bush-clover', 'Clover Bush', 'farm', 6, 'bush-clover.png', TRUE, 66),
  ('haystack', 'Haystack', 'farm', 15, 'haystack.png', TRUE, 67),
  ('pet-bird', 'Bird', 'furniture', 80, 'budgie_blue.gif', FALSE, 69),
  ('tv-cooking', 'TV (cooking)', 'furniture', 120, 'TV_cooking_dessert.gif', FALSE, 70),
  ('bed-dusty-rose', 'Dusty Rose Bed', 'furniture', 50, 'bed-dusty-rose', FALSE, 71),
  ('bed-navy-blue', 'Navy Blue Bed', 'furniture', 50, 'bed-navy-blue', FALSE, 72),
  ('bed-mustard-yellow', 'Mustard Yellow Bed', 'furniture', 50, 'bed-mustard-yellow', FALSE, 73),
  ('bed-lavender', 'Lavender Bed', 'furniture', 50, 'bed-lavender', FALSE, 74),
  ('bed-cream-white', 'Cream White Bed', 'furniture', 50, 'bed-cream-white', FALSE, 75);
-- Items with a per-player limit (max_quantity); everything above has none.
INSERT INTO seed_items (id, name, type, price, asset, stackable, max_quantity, sort_order) VALUES
  ('chicken', 'Chicken', 'farm', 40, 'Chicken_Sprite_Sheet.png', TRUE, 5, 68);
INSERT INTO items (id, name, type, price, asset, stackable, max_quantity, sort_order)
  SELECT id, name, type, price, asset, stackable, max_quantity, sort_order FROM seed_items
  ON DUPLICATE KEY UPDATE name = VALUES(name), type = VALUES(type), price = VALUES(price), asset = VALUES(asset), stackable = VALUES(stackable), max_quantity = VALUES(max_quantity), sort_order = VALUES(sort_order);
DELETE FROM items WHERE id NOT IN (SELECT id FROM seed_items) AND id NOT IN (SELECT item_id FROM user_items);
DROP TEMPORARY TABLE seed_items;

INSERT IGNORE INTO players (id, level, xp, coins, outfit) VALUES ('player-1', 1, 0, 0, 'default');
