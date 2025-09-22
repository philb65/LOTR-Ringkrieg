

import { AdjacencyList } from './graph';
import { Unit, Faction } from '../types';

export const findReachableNodes = (
    movingUnit: Unit,
    maxDistance: number,
    graph: AdjacencyList,
    allUnits: Unit[],
    allFactions: Faction[]
): { distances: Map<number, number>, paths: Map<number, number | null> } => {
    const startNodeId = movingUnit.nodeId;
    const movingUnitFaction = allFactions.find(f => f.name === movingUnit.factionName);

    if (!movingUnitFaction) {
        return { distances: new Map(), paths: new Map() };
    }

    const enemyOccupiedNodes = new Set<number>();
    const friendlyOccupiedNodes = new Set<number>();

    allUnits.forEach(unit => {
        if (unit.id === movingUnit.id) return;
        const unitFaction = allFactions.find(f => f.name === unit.factionName);
        if (unitFaction) {
            if (unitFaction.team === movingUnitFaction.team) {
                friendlyOccupiedNodes.add(unit.nodeId);
            } else {
                enemyOccupiedNodes.add(unit.nodeId);
            }
        }
    });

    const distances = new Map<number, number>();
    const paths = new Map<number, number | null>();
    // Using a queue that is sorted by distance makes this a Dijkstra-like algorithm, which is correct for finding shortest paths.
    const queue: { nodeId: number; distance: number }[] = [];

    distances.set(startNodeId, 0);
    paths.set(startNodeId, null);
    queue.push({ nodeId: startNodeId, distance: 0 });

    while (queue.length > 0) {
        // Sort the queue to always process the node with the smallest distance first.
        queue.sort((a, b) => a.distance - b.distance);
        const { nodeId, distance } = queue.shift()!;

        if (distance >= maxDistance) {
            continue;
        }

        const neighbors = graph.get(nodeId) || [];
        for (const neighbor of neighbors) {
            // Enemy nodes are walls. Cannot move through or onto them.
            if (enemyOccupiedNodes.has(neighbor)) {
                continue;
            }

            const newDistance = distance + 1;
            // The crucial check: have we found a new node or a shorter path to an existing one?
            if (!distances.has(neighbor) || newDistance < distances.get(neighbor)!) {
                // *** FIX: Store the actual distance in the distances map. ***
                distances.set(neighbor, newDistance);
                paths.set(neighbor, nodeId);
                // Add the neighbor to the queue for exploration.
                // To prevent duplicates which can slow down the algorithm, we can find and update if it exists.
                const existingQueueEntry = queue.find(item => item.nodeId === neighbor);
                if (existingQueueEntry) {
                    existingQueueEntry.distance = newDistance;
                } else {
                    queue.push({ nodeId: neighbor, distance: newDistance });
                }
            }
        }
    }
    
    // Now, remove friendly-occupied nodes from the final list of reachable destinations.
    // Units can move THROUGH these nodes, but cannot end their turn on them.
    friendlyOccupiedNodes.forEach(nodeId => {
        distances.delete(nodeId);
    });

    return { distances, paths };
};

export const reconstructPath = (
    targetNodeId: number,
    paths: Map<number, number | null>
): number[] => {
    const path: number[] = [];
    let currentNode: number | null | undefined = targetNodeId;

    while (currentNode !== null && currentNode !== undefined) {
        path.unshift(currentNode);
        currentNode = paths.get(currentNode);
    }

    return path;
};