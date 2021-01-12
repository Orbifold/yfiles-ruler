export class RandomGraph {

    /**
     * Simple balanced tree
     *
     * @memberof randomgraph
     * @param {Number} r number of children each node has
     * @param {Number} h height of the tree
     */
    static BalancedTree(r = 3, h = 3) {
        let v = 0;
        const graph = { nodes: [{ label: '0', id: 0 }], edges: [] };
        let newLeaves = [],
            i, j, height, node, leaves;

        for (i = 0; i < r; i++) {
            node = { label: (++v).toString(), id: (v - 1) };
            graph.nodes.push(node);
            newLeaves.push(node);
            graph.edges.push({ source: 0, target: v });
        }

        for (height = 1; height < h; height++) {
            leaves = newLeaves;
            newLeaves = [];
            for (j = 0; j < leaves.length; j++) {
                for (i = 0; i < r; i++) {
                    node = { label: (++v).toString(), id: (v - 1) };
                    newLeaves.push(node);
                    graph.nodes.push(node);
                    graph.edges.push({ source: leaves[j].id, target: v });
                }
            }
        }
        return graph;
    }

    /**
     * Erdős–Rényi aka Gilbert
     *
     * @memberof randomgraph.ErdosRenyi
     * @param {Number} n number of nodes
     * @param {Number} p probability of a edge between any two nodes
     */
    static ErdosRenyi1(n = 30, p = 0.2) {
        const graph = { nodes: [], edges: [] };
        let i, j;
        for (i = 0; i < n; i++) {
            graph.nodes.push({ id: i, label: i.toString() });
            for (j = 0; j < i; j++) {
                if (Math.random() < p) {
                    graph.edges.push({
                        source: i,
                        target: j
                    });
                }
            }
        }
        return graph;
    }

    /**
     * Erdős–Rényi
     *
     * @memberof randomgraph.ErdosRenyi
     * @param {Number} n number of nodes
     * @param {Number} M number of edges
     */
    static ErdosRenyi2(n = 30, M = 30) {
        const graph = { nodes: [], edges: [] },
            tmpEdges = [];
        let i, j, k;
        for (i = 0; i < n; i++) {
            graph.nodes.push({ label: 'node ' + i });
            for (j = i + 1; j < n; j++) {
                tmpEdges.push({ source: i, target: j });
            }
        }
        // pick m random edges from tmpEdges
        k = tmpEdges.length - 1;
        for (i = 0; i < M; i++) {
            graph.edges.push(tmpEdges.splice(Math.floor(Math.random() * k), 1)[0]);
            k--;
        }
        return graph;
    }

    /**
     * Watts-Strogatz Small World model Alpha
     *
     * @param {Number} n number of nodes
     * @param {Number} K mean degree (even integer)
     * @param {Number} alpha rewiring probability [0..1]
     */
    static WattsStrogatz1(n = 30, k = 3, alpha = 0.4) {
        const graph = { nodes: [], edges: [] };
        let i, j, edge;
        const p = Math.pow(10, -10);
        let ec = 0;
        const edge_lut = {},
            ids = [],
            nk_half = n * k / 2;
        let Rij, sumRij, r, pij;

        for (i = 0; i < n; i++) {
            graph.nodes.push({ id: i, label: 'node ' + i });
            // create a latice ring structure
            edge = { source: i, target: (i + 1) % n };
            edge_lut[edge.source + '-' + edge.target] = edge;
            graph.edges.push(edge);
            ec++;
        }
        // Creating n * k / 2 edges
        while (ec < nk_half) {
            for (i = 0; i < n; i++) {
                ids.push(i);
            }
            while (ec < nk_half && ids.length > 0) {
                i = ids.splice(Math.floor(Math.random() * ids.length), 1)[0];
                Rij = [];
                sumRij = 0;
                for (j = 0; j < n; j++) {
                    Rij[j] = calculateRij(i, j);
                    sumRij += Rij[j];
                }
                r = Math.random();
                pij = 0;
                for (j = 0; j < n; j++) {
                    if (i != j) {
                        pij += Rij[j] / sumRij;
                        if (r <= pij) {
                            edge = { source: i, target: j };
                            graph.edges.push(edge);
                            ec++;
                            edge_lut[edge.source + '-' + edge.target] = edge;
                        }
                    }
                }
            }
        }

        return graph;

        function calculateRij(i, j) {
            if (i == j || edge_lut[i + '-' + j]) return 0;
            const mij = calculatemij(i, j);
            if (mij >= k) return 1;
            if (mij === 0) return p;
            return Math.pow(mij / k, alpha) * (1 - p) + p;
        }

        function calculatemij(i, j) {
            let mij = 0, l;
            for (l = 0; l < n; l++) {
                if (l != i && l != j && edge_lut[i + '-' + l] && edge_lut[j + '-' + l]) {
                    mij++;
                }
            }
            return mij;
        }
    }

    /**
     * Watts-Strogatz Small World model Beta
     *
     * @memberof randomgraph.WattsStrogatz
     * @param {Number} n number of nodes
     * @param {Number} K mean degree (even integer)
     * @param {Number} beta rewiring probability [0..1]
     */
    static WattsStrogatz2(n = 30, K = 3, beta = 0.4) {
        const graph = { nodes: [], edges: [] };
        let i, j, t, edge;
        const edge_lut = {};
        K = K >> 1; // divide by two
        for (i = 0; i < n; i++) {
            graph.nodes.push({ label: 'node ' + i });
            // create a latice ring structure
            for (j = 1; j <= K; j++) {
                edge = { source: i, target: (i + j) % n };
                edge_lut[edge.source + '-' + edge.target] = edge;
                graph.edges.push(edge);
            }
        }
        // rewiring of edges
        for (i = 0; i < n; i++) {
            for (j = 1; j <= K; j++) { // for every pair of nodes
                if (Math.random() <= beta) {
                    do {
                        t = Math.floor(Math.random() * (n - 1));
                    } while (t == i || edge_lut[i + '-' + t]);
                    const j_ = (i + j) % n;
                    edge_lut[i + '-' + j_].target = t; // rewire
                    edge_lut[i + '-' + t] = edge_lut[i + '-' + j_];
                    delete edge_lut[i + '-' + j_];
                }
            }
        }
        return graph;
    }

    /**
     * Barabási–Albert
     *
     * @memberof randomgraph
     * @param {Number} N total number of nodes  N  > 0
     * @param {Number} m0 m0 > 0 && m0 <  N
     * @param {Number} M M  > 0 && M  <= m0
     */
    static BarabasiAlbert(N = 30, m0 = 5, M = 3) {
        const graph = { nodes: [], edges: [] },
            edge_lut = {},
            degrees = [];
        let i, j, edge, sum, s, m, r, p;
        // creating m0 nodes
        for (i = 0; i < m0; i++) {
            graph.nodes.push({ label: 'node ' + i });
            degrees[i] = 0;
        }
        // Linking every node with each other (no self-loops)
        for (i = 0; i < m0; i++) {
            for (j = i + 1; j < m0; j++) {
                edge = { source: i, target: j };
                edge_lut[edge.source + '-' + edge.target] = edge;
                graph.edges.push(edge);
                degrees[i]++;
                degrees[j]++;
            }
        }
        // Adding N - m0 nodes, each with M edges
        for (i = m0; i < N; i++) {
            graph.nodes.push({ label: 'node ' + i });
            degrees[i] = 0;
            sum = 0;  // sum of all nodes degrees
            for (j = 0; j < i; j++) sum += degrees[j];
            s = 0;
            for (m = 0; m < M; m++) {
                r = Math.random();
                p = 0;
                for (j = 0; j < i; j++) {
                    if (edge_lut[i + '-' + j] || edge_lut[j + '-' + i]) continue;
                    if (i == 1) p = 1;
                    else p += degrees[j] / sum + s / (i - m);

                    if (r <= p) {
                        s += degrees[j] / sum;
                        edge = { source: i, target: j };
                        edge_lut[edge.source + '-' + edge.target] = edge;
                        graph.edges.push(edge);
                        degrees[i]++;
                        degrees[j]++;
                        break;
                    }
                }
            }
        }
        return graph;
    }
}