import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cameraTranslation, clampCamera, HOME_CAMERA, viewportToWorld, WORLD_TILES_PER_SIDE } from '../src/services/worldCamera.ts';

test('the initial camera shows exactly the center tile', () => {
  const viewport = { width: 900, height: 880 };
  assert.equal(WORLD_TILES_PER_SIDE, 3);
  assert.deepEqual(cameraTranslation(HOME_CAMERA, viewport), { x: -900, y: -880 });
  assert.deepEqual(viewportToWorld({ x: 0, y: 0 }, HOME_CAMERA, viewport), { x: 900, y: 880 });
});

test('returning from every world edge always yields the opening view', () => {
  const viewport = { width: 900, height: 880 };
  const initial = cameraTranslation(HOME_CAMERA, viewport);
  for (const x of [-1, 1]) for (const y of [-1, 1]) {
    const edge = clampCamera({ x: x * 5000, y: y * 5000 }, viewport);
    assert.notDeepEqual(cameraTranslation(edge, viewport), initial);
    assert.deepEqual(cameraTranslation(HOME_CAMERA, viewport), initial);
    assert.deepEqual(cameraTranslation(HOME_CAMERA, viewport), initial);
  }
});

test('the camera reaches every edge without exposing space outside the world', () => {
  const viewport = { width: 900, height: 880 };
  for (const x of [-1, 0, 1]) for (const y of [-1, 0, 1]) {
    const offset = { x: x * viewport.width, y: y * viewport.height };
    const translation = cameraTranslation(offset, viewport);
    assert.equal(translation.x, (x - 1) * viewport.width);
    assert.equal(translation.y, (y - 1) * viewport.height);
    assert.ok(translation.x <= 0 && translation.x >= -2 * viewport.width);
    assert.ok(translation.y <= 0 && translation.y >= -2 * viewport.height);
  }
  assert.deepEqual(clampCamera({ x: -5000, y: 5000 }, viewport), { x: -900, y: 880 });
  assert.deepEqual(clampCamera({ x: 5000, y: -5000 }, viewport), { x: 900, y: -880 });
});
