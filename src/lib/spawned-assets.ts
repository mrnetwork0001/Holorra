/**
 * Contract between the studio page (which submits and polls Lux3D jobs) and the
 * stage (which drops finished models onto the floor in front of the camera).
 */
export interface SpawnedAsset {
  /** stable id; the stage loads each id once */
  id: string;
  /** same-origin URL of a GLB (live results go through /api/aholo/asset) */
  url: string;
  /** short label shown above the model, e.g. the prompt */
  label: string;
  /** "live" = finished Lux3D job; "cached" = a stored real Lux3D result used without an API key */
  source: "live" | "cached";
  taskId?: number;
}

/** A job the studio is still waiting on, shown as a progress chip on the stage. */
export interface PendingJob {
  taskId: number;
  label: string;
  method: string;
  startedAt: number;
  status: "running" | "failed";
}
