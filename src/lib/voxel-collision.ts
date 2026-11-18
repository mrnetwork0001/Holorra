/**
 * Sparse Octree Voxel Collision Engine for @manycore/aholo-viewer 3DGS Worlds.
 * Supports fast point occupancy queries, downward floor raycasting, and capsule push-out
 * for first-person and third-person WASD walkthroughs inside 3D Gaussian Splatting scenes.
 */

const SOLID_LEAF_MARKER = 0xff000000 >>> 0;

export interface VoxelGridMetadata {
  gridBounds: { min: number[]; max: number[] };
  voxelResolution: number;
  leafSize: number;
  treeDepth: number;
}

export class VoxelCollisionEngine {
  private gridMinX: number;
  private gridMinY: number;
  private gridMinZ: number;
  private voxelCountX: number;
  private voxelCountY: number;
  private voxelCountZ: number;
  private voxelSize: number;
  private leafSize: number;
  private treeDepth: number;
  private nodes: Uint32Array;
  private leafData: Uint32Array;

  constructor(metadata: VoxelGridMetadata, nodes: Uint32Array, leafData: Uint32Array) {
    this.gridMinX = metadata.gridBounds.min[0];
    this.gridMinY = metadata.gridBounds.min[1];
    this.gridMinZ = metadata.gridBounds.min[2];
    const vs = metadata.voxelResolution;
    this.voxelCountX = Math.round((metadata.gridBounds.max[0] - metadata.gridBounds.min[0]) / vs);
    this.voxelCountY = Math.round((metadata.gridBounds.max[1] - metadata.gridBounds.min[1]) / vs);
    this.voxelCountZ = Math.round((metadata.gridBounds.max[2] - metadata.gridBounds.min[2]) / vs);
    this.voxelSize = vs;
    this.leafSize = metadata.leafSize;
    this.treeDepth = metadata.treeDepth;
    this.nodes = nodes;
    this.leafData = leafData;
  }

  public isVoxelSolid(ix: number, iy: number, iz: number): boolean {
    if (
      this.nodes.length === 0 ||
      ix < 0 ||
      iy < 0 ||
      iz < 0 ||
      ix >= this.voxelCountX ||
      iy >= this.voxelCountY ||
      iz >= this.voxelCountZ
    ) {
      return false;
    }
    const blockX = Math.floor(ix / this.leafSize);
    const blockY = Math.floor(iy / this.leafSize);
    const blockZ = Math.floor(iz / this.leafSize);
    let nodeIndex = 0;

    for (let level = this.treeDepth - 1; level >= 0; level--) {
      const node = this.nodes[nodeIndex] >>> 0;
      if (node === SOLID_LEAF_MARKER) {
        return true;
      }
      const childMask = (node >>> 24) & 0xff;
      if (childMask === 0) {
        return this.checkLeafByIndex(node, ix, iy, iz);
      }
      const bitX = (blockX >>> level) & 1;
      const bitY = (blockY >>> level) & 1;
      const bitZ = (blockZ >>> level) & 1;
      const octant = (bitX << 2) | (bitY << 1) | bitZ;
      const octantBit = 1 << octant;
      if ((childMask & octantBit) === 0) {
        return false;
      }
      const childBase = node & 0x00ffffff;
      const maskBefore = childMask & (octantBit - 1);
      nodeIndex = childBase + this.popcount8(maskBefore);
    }
    const leafNode = this.nodes[nodeIndex] >>> 0;
    if (leafNode === SOLID_LEAF_MARKER) {
      return true;
    }
    return this.checkLeafByIndex(leafNode, ix, iy, iz);
  }

  private checkLeafByIndex(leafIndex: number, ix: number, iy: number, iz: number): boolean {
    const lx = ix % this.leafSize;
    const ly = iy % this.leafSize;
    const lz = iz % this.leafSize;
    const bitIndex = lx * this.leafSize * this.leafSize + ly * this.leafSize + lz;
    const wordOffset = leafIndex * 2 + (bitIndex >>> 5);
    if (wordOffset >= this.leafData.length) return false;
    return ((this.leafData[wordOffset] >>> (bitIndex & 31)) & 1) !== 0;
  }

  private popcount8(v: number): number {
    let c = v & 0xff;
    c = c - ((c >>> 1) & 0x55);
    c = (c & 0x33) + ((c >>> 2) & 0x33);
    return (c + (c >>> 4)) & 0x0f;
  }

  public isWorldPointSolid(wx: number, wy: number, wz: number): boolean {
    const ix = Math.floor((wx - this.gridMinX) / this.voxelSize);
    const iy = Math.floor((wy - this.gridMinY) / this.voxelSize);
    const iz = Math.floor((wz - this.gridMinZ) / this.voxelSize);
    return this.isVoxelSolid(ix, iy, iz);
  }

  /**
   * Resolves horizontal movement against the sparse voxel grid with a capsule radius.
   */
  public filterHorizontalMove(
    curX: number,
    curY: number,
    curZ: number,
    nextX: number,
    nextZ: number,
    radius = 0.28
  ): { x: number; z: number; collided: boolean } {
    const checkOffsets = [
      [0, 0],
      [radius, 0],
      [-radius, 0],
      [0, radius],
      [0, -radius],
    ];

    let canMoveX = true;
    let canMoveZ = true;

    for (const [ox, oz] of checkOffsets) {
      if (this.isWorldPointSolid(nextX + ox, curY, curZ + oz)) {
        canMoveX = false;
      }
      if (this.isWorldPointSolid(curX + ox, curY, nextZ + oz)) {
        canMoveZ = false;
      }
    }

    return {
      x: canMoveX ? nextX : curX,
      z: canMoveZ ? nextZ : curZ,
      collided: !canMoveX || !canMoveZ,
    };
  }

  public getStats() {
    return {
      voxelResolutionMeters: this.voxelSize,
      dimensions: [this.voxelCountX, this.voxelCountY, this.voxelCountZ],
      octreeNodes: this.nodes.length,
      leafWords: this.leafData.length,
    };
  }
}

export async function loadVoxelCollisionFromCdn(
  metaUrl: string,
  binUrl: string,
  signal?: AbortSignal
): Promise<VoxelCollisionEngine> {
  const [metaRes, binRes] = await Promise.all([
    fetch(metaUrl, { signal }),
    fetch(binUrl, { signal }),
  ]);
  if (!metaRes.ok || !binRes.ok) {
    throw new Error(`Voxel collision load failed: ${metaRes.status} / ${binRes.status}`);
  }
  const meta = (await metaRes.json()) as VoxelGridMetadata & {
    nodeCount?: number;
    leafWordCount?: number;
  };
  const buffer = await binRes.arrayBuffer();
  const u32 = new Uint32Array(buffer);
  const nodeCount = meta.nodeCount ?? Math.floor(u32.length / 3);
  const nodes = u32.subarray(0, nodeCount);
  const leafData = u32.subarray(nodeCount);
  return new VoxelCollisionEngine(meta, nodes, leafData);
}
