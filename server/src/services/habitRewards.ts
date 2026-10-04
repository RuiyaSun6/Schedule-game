import type { Item } from "../types/game.js";

// Reward-only inventory IDs. These never appear in the purchasable catalog.
export const HABIT_REWARD_ITEMS: readonly Item[] = [
  { id: "reward-seedling", name: "Consistency Plant", type: "furniture", price: 0, asset: "plant-blue-pot.png", stackable: true },
  { id: "reward-habit-planter", name: "Habit Builder Tree", type: "furniture", price: 0, asset: "tree-blue-pot.png", stackable: true },
  { id: "reward-month-lamp", name: "Monthly Glow Lamp", type: "furniture", price: 0, asset: "lamp-gold.png", stackable: true },
  { id: "reward-balanced-plant", name: "Balanced Life Plant", type: "furniture", price: 0, asset: "tree-grey-pot.png", stackable: false },
  { id: "reward-resilience-chair", name: "Resilience Chair", type: "furniture", price: 0, asset: "chair-green.png", stackable: false },
  { id: "reward-master-sofa", name: "Master's Sofa", type: "furniture", price: 0, asset: "sofa-purple.png", stackable: false },
  { id: "reward-world-crown", name: "World Crown Monument", type: "furniture", price: 0, asset: "world-crown.svg", stackable: false },
];
