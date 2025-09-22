import { EdgeData } from '../types';

export type AdjacencyList = Map<number, number[]>;

export const createGraph = (edges: EdgeData[]): AdjacencyList => {
    const adjList: AdjacencyList = new Map();

    edges.forEach(edge => {
        if (!adjList.has(edge.source)) {
            adjList.set(edge.source, []);
        }
        if (!adjList.has(edge.target)) {
            adjList.set(edge.target, []);
        }
        adjList.get(edge.source)!.push(edge.target);
        adjList.get(edge.target)!.push(edge.source);
    });

    return adjList;
};

export const findDistance = (startNodeId: number, endNodeId: number, graph: AdjacencyList): number => {
    if (startNodeId === endNodeId) return 0;

    const queue: { nodeId: number, distance: number }[] = [{ nodeId: startNodeId, distance: 0 }];
    const visited = new Set<number>([startNodeId]);

    while (queue.length > 0) {
        const { nodeId, distance } = queue.shift()!;

        if (nodeId === endNodeId) {
            return distance;
        }

        const neighbors = graph.get(nodeId) || [];
        for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push({ nodeId: neighbor, distance: distance + 1 });
            }
        }
    }

    return Infinity; // Path not found
};