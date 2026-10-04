# Shop catalog

Every shop item is one standalone product with its own PNG, card, price, and Buy button. There are no product families, styles, quantities, or a separate demo purse; all purchases go through `POST /api/shop/purchase` and the returned player updates coins and ownership immediately.

## Items (57)

| Kind | Category tab | Variants | Price |
|---|---|---|---|
| Plant | PLANTS | red, brown, blue, grey pot | 20 |
| Lamp | LIGHTING | black, gold, copper, grey; tan shade with black, gold, copper, grey base | 50 |
| Chair | SEATING | cream, caramel, dark brown, chestnut, grey, black, green, teal, pink | 40 |
| Sofa | SEATING | beige, slate, charcoal, brown, red, coral, orange, green, teal, navy, purple, rosewood | 100 |
| Pet corner | PETS | food bowl 20, scratching post 40, cozy cat bed 60, cat tree 120 | — |
| Flowers | GARDEN | red, brown, blue pot | 30 |
| Tree | GARDEN | red, brown, blue, grey pot | 50 |
| Bench | GARDEN | cream, caramel, dark brown, chestnut, grey, black, green, teal, pink | 80 |
| Fountain | GARDEN | (no artwork yet) | 150 |
| Hat, Hoodie, Sneakers | CLOTHING | (no artwork yet) | 40, 60, 80 |

IDs are `<kind>-<colour>` (for example `lamp-gold`, `plant-blue-pot`). The backend catalog (`server/src/services/shopService.ts` and `server/src/db/schema.sql`) is the source of truth for names, prices, and order.

## Artwork

`scripts/split-shop-sprites.mjs` crops each colour variant out of the interior pack sheets (`decorations.png`, `chairs.png`, `couches.png` under `public/assets/interior full/furniture/`) by detecting each object's opaque pixels, drops near-identical duplicates, and writes:

- `src/assets/furniture/<id>.png` and `src/assets/garden/<id>.png`
- `src/data/shopSprites.ts` (name, kind, size, and source rectangle per item; generated, do not edit)

Rerun it with `node scripts/split-shop-sprites.mjs --preview preview.png` after changing the families in the script. Pet art comes from `scripts/crop-pet-sprites.mjs`.

Sprites are shown at whole-number scales with `image-rendering: pixelated`: up to a 96px box on shop cards, 3x (phone) or 5x (desktop) in the bedroom, and up to 72px in the garden.

## Where bought items appear

- Bedroom: one fixed slot each for plant, lamp, chair, and sofa, plus the pet corner (box → cat bed → cat tree, with bowl and scratching post).
- Garden: one fixed slot each for flowers, tree, bench, and fountain.
- When several variants of one kind are owned, the slot shows the most recently bought one (`player.ownedItems` is in purchase order); the others are listed in the Backpack.
- MOVE OBJECTS drags any slot or the pet corner; bedroom positions are saved per player in localStorage.
