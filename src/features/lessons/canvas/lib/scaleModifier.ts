import type { Modifier } from '@dnd-kit/core'

export function createScaleModifier(getScale: () => number): Modifier {
  return ({ transform }) => ({
    ...transform,
    x: transform.x / getScale(),
    y: transform.y / getScale(),
  })
}
