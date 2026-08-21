import * as THREE from 'three';
import type { Updatable } from '../SceneManager';

export function applyStageEffects(group: THREE.Group, stage: string): Updatable[] {
  const updatables: Updatable[] = [];

  switch (stage) {
    case 'idea':
    case 'experiment':
    case 'prototype':
      // Basic factories provide enough visual context (e.g., Orion's crane and pallets).
      // We don't need to manually spawn massive boxes here.
      break;
    case 'shipped':
    case 'growing':
    case 'landmark': {
      // The town layout already provides plazas and trees.
      // We don't need to generate massive concrete slabs here.
      break;
    }
  }

  return updatables;
}
