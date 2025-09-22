import { Unit, FactionName } from '../types';
import { AdjacencyList } from './graph';

/**
 * Determines which units of a given faction are in supply.
 * A supply chain starts from source nodes (castles, start points) and is extended by friendly units.
 * A unit is in supply if it's on a node that can be traced back to a source through a continuous chain of friendly units,
 * where each link is within the previous unit's supply range (RW_U).
 * @param factionName The faction to check supply for.
 * @param sourceNodeIds A set of node IDs that act as the origin of supply.
 * @param units A list of all units in the game.
 * @param graph The adjacency list representing the map graph.
 * @returns A set of unit IDs that are in supply.
 */
export const checkSupplyForFaction = (
    factionName: FactionName,
    sourceNodeIds: ReadonlySet<number>,
    units: Unit[],
    graph: AdjacencyList
): Set<string> => {
    const factionUnits = units.filter(u => u.factionName === factionName && !u.isDying);
    if (factionUnits.length === 0) {
        return new Set<string>();
    }

    const unitsByNode = new Map(factionUnits.map(u => [u.nodeId, u]));
    const suppliedUnitIds = new Set<string>();

    // The queue holds all nodes that are considered "in supply territory".
    const queue: number[] = [...sourceNodeIds];
    const visitedNodes = new Set<number>(sourceNodeIds);

    let head = 0;
    while (head < queue.length) {
        const currentNodeId = queue[head++];
        
        // Check if a friendly unit is on this supplied node.
        const unitOnNode = unitsByNode.get(currentNodeId);

        // If a unit is on a supplied node, it is officially in supply.
        if (unitOnNode && !suppliedUnitIds.has(unitOnNode.id)) {
            suppliedUnitIds.add(unitOnNode.id);
        }

        // This unit can now extend the supply chain further.
        if (unitOnNode) {
            const supplyRange = unitOnNode.baseStats.RW_U;
            if (supplyRange > 0) {
                // Perform a local BFS to find all nodes within the unit's supply range.
                const rangeQueue: { nodeId: number, dist: number }[] = [{ nodeId: currentNodeId, dist: 0 }];
                const visitedForRange = new Set([currentNodeId]);
                let rangeHead = 0;

                while (rangeHead < rangeQueue.length) {
                    const { nodeId, dist } = rangeQueue[rangeHead++];
                    
                    if (dist >= supplyRange) continue;

                    const neighbors = graph.get(nodeId) || [];
                    for (const neighbor of neighbors) {
                        if (!visitedForRange.has(neighbor)) {
                            visitedForRange.add(neighbor);
                            rangeQueue.push({ nodeId: neighbor, dist: dist + 1 });
                            
                            // If this newly reached node hasn't been part of the main supply search yet, add it to the main queue to be processed.
                            if (!visitedNodes.has(neighbor)) {
                                visitedNodes.add(neighbor);
                                queue.push(neighbor);
                            }
                        }
                    }
                }
            }
        }
    }
    
    return suppliedUnitIds;
};
