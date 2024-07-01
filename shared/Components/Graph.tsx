declare var d3: any;

type GraphData = {
    nodes?: GraphNode[];
    edges?: GraphEdge[];
    data?: any;
}

interface GraphNode {
    id: string;
    label?: string;
    color?: string;
    shape?: 'rect' | 'circle';
    items?: GraphNode[];
    [key: string]: any;
}

interface GraphEdge {
    source: string;
    target: string;
    label?: string;
    [key: string]: any;
}

interface GraphProps extends JSX.Component<HTMLElement> {
    data: GraphData | JSX.IReference<GraphData>;
    onNodeClick?: (node: any) => void;
}

export function Graph(props: GraphProps, children: HTMLElement | HTMLElement[] | (() => HTMLElement[])) {
    let { ref, class: className, data, onNodeClick } = props;
    if (typeof (children) === 'function') children = children();
    if (!Array.isArray(children)) children = [children];
    children = children.flat();
    if (!ref) ref = $reference<HTMLElement>();

    ref.onLoad.add((element) => {
        function render(data: GraphData) {
            if (data.data) {
                drawGraphHierarchy(
                    element,
                    data.data,
                    onNodeClick
                );
            } else {
                drawGraph(
                    element,
                    data.nodes,
                    data.edges
                );
            }
        }
        if (isReference(data)) {
            data.onLoad.add(render);
        } else {
            render(data);
        }
    });

    return (
        <div class={`graph-view ${className || ''}`.trim()} ref={ref}>
            {children}
        </div>
    );

    function drawGraphHierarchy(selector: HTMLElement, data: any, onNodeClick?: (node: any) => void) {
        console.log('drawGraphHierarchy', data);
        const graphDiv = d3.select(selector);
        graphDiv.selectAll('*').remove();

        let width = selector.clientWidth;
        let height = selector.clientHeight;
        if (!width || !height) {
            width = selector.parentElement!.clientWidth || 800;
            height = selector.parentElement!.clientHeight || 600;
            console.log('parentElement:', selector.parentElement, width, height);
        }

        const hierarchy = d3.hierarchy(data).sum(d => 1).sort((a, b) => b.height - a.height || b.value - a.value);
        const treeLayout = d3.tree().size([height, width / 1.5]);
        const root = treeLayout(hierarchy);

        // Calculate new positions for last level nodes
        let lastLevel = {};
        root.descendants().forEach(d => {
            if (!d.children) {
                lastLevel[d.data.label] = lastLevel[d.data.label] || [];
                lastLevel[d.data.label].push(d);
            }
        });

        Object.values<any>(lastLevel).forEach((group: any[]) => {
            const avgX = group.reduce((acc, d) => acc + d.x, 0) / group.length;
            group.forEach(d => { d.x = avgX; });
        });

        const svg = d3.create("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [0, 0, width, height])
            .style("font", "12px sans-serif");

        const zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on('zoom', event => {
                svgGroup.attr('transform', event.transform);
            });

        svg.call(zoom);

        const svgGroup = svg.append('g')
            .attr("transform", "translate(100,100)");

        const link = svgGroup.append("g")
            .attr("fill", "none")
            .attr("stroke", "#555")
            .attr("stroke-opacity", 0.4)
            .attr("stroke-width", 1.5)
            .selectAll("path")
            .data(root.links())
            .join("path")
            .attr("d", d3.linkHorizontal()
                .x(d => d.y)
                .y(d => d.x));

        const node = svgGroup.append("g")
            .selectAll("g")
            .data(root.descendants())
            .join("g")
            .attr("transform", d => `translate(${d.y},${d.x})`);

        node.append("circle")
            .attr("fill", d => d.children ? "#555" : "#999")
            .attr("r", 7);

        let uniqueLabels = {};
        node.append("text")
            .filter(d => {
                if (uniqueLabels[d.data.label + d.x]) {
                    return false;
                }
                uniqueLabels[d.data.label + d.x] = true;
                return true;
            })
            .attr('class', 'node-label')
            .attr("x", d => d.children ? -8 : 8)
            .attr("text-anchor", d => d.children ? "end" : "start")
            .text(d => d.data.label)
            .attr("stroke", "white")
            .style('cursor', 'pointer');

        const itemBoxes = node.append('g')
            .attr('class', 'item-boxes')
            .filter(d => d.data.items)
            .attr('display', 'none');

        itemBoxes
            .append('rect')
            .attr('width', d => d.data.items.reduce((w, n) => Math.max(200, n.label.length * 10), 0))
            .attr('height', d => d.data.items.length * 22)
            .attr('fill', d => d.color || 'white')
            .attr('stroke', '#666')
            .attr('x', d => 170)
            .attr('y', -10)
            .attr('rx', 5)
            .attr('ry', 5)

        itemBoxes
            .selectAll('g')
            .data(d => d.data.items.map(i => [d, i]))
            .enter()
            .append('text')
            .attr('stroke', 'black')
            .attr('x', ([d]) => 180)
            .attr('y', (_, i) => 10 + i * 20)
            .text(([_, i]) => i.label);

        let timeout, hideBox;
        node.on('mouseover', function (this, event, d) {
            clearTimeout(timeout);
            if (hideBox) hideBox();
            const item = d3.select(this);
            item.select('.item-boxes').attr('display', 'block');
            // find related children and highlight them
            const related = new Set();
            const findRelated = (node) => {
                related.add(node.data.label);
                if (node.children) {
                    node.children.forEach(findRelated);
                }
            };
            findRelated(d);
            node.attr('stroke', n => related.has(n.data.label) ? 'green' : 'white');
            //item.select('.node-label').attr('stroke', 'green');
        });

        node.on('mouseout', function (this, event, d) {
            const item = d3.select(this);
            item.select('.node-label').attr('stroke', 'white');
            timeout = setTimeout(hideBox = () => {
                item.select('.item-boxes').attr('display', 'none');
                hideBox = null;
            }, 500);
        });

        itemBoxes.on('mouseover', function (this, event, d) {
            clearTimeout(timeout);
        });

        itemBoxes.on('mouseout', function (this, event, d) {
            timeout = setTimeout(hideBox = () => {
                d3.select(this).attr('display', 'none');
                hideBox = null;
            }, 500);
        });

        node.on('click', function (this, event, d) {
            if (onNodeClick) onNodeClick(d.data);
        });

        graphDiv.node().append(svg.node());

        const bounds = svgGroup.node().getBBox();
        const dx = bounds.width, dy = bounds.height;
        const x = bounds.x + dx / 2, y = bounds.y + dy / 2;
        const scale = 0.75 / Math.max(dx / width, dy / height);
        const translate = [width / 2 - scale * x, height / 2 - scale * y];

        svg.transition()
            .duration(750)
            .call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
    }

    function drawGraph(selector, nodes, edges) {
        console.log('drawGraph', nodes, edges);
        const links = edges.map(link => ({ ...link, link }));
        const graphDiv = d3.select(selector);
        graphDiv.selectAll('*').remove();

        const width = +graphDiv.style('width').replace('px', '');
        const height = +graphDiv.style('height').replace('px', '');

        const svgElement = graphDiv.append('svg')
            .attr('width', width)
            .attr('height', height)
            .call(d3.zoom().on('zoom', event => {
                svgGroup.attr('transform', event.transform);
            }));

        const svgGroup = svgElement.append('g');

        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(edges).id(d => d.id).distance(0).strength(1))
            .force('charge', d3.forceManyBody().strength(-50))
            .force('x', d3.forceX(width / 2))
            .force('y', d3.forceY(height / 2))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collide', d3.forceCollide(175));

        const linkGroup = svgGroup.append('g')
            .attr('class', 'links');

        const linkElements = linkGroup.selectAll('line')
            .data(edges)
            .enter().append('line')
            .attr('stroke-width', 1.5)
            .attr('stroke', 'white');

        console.log('links', links);
        const linkLabelElements = linkGroup.selectAll('.link-label')
            .data(links)
            .filter(d => d.label)
            .enter().append('text')
            .attr('class', 'link-label')
            .attr('font-size', '10px')
            .attr('fill', 'white')
            .text(d => d.label || 'no label');

        const nodeGroups = svgGroup.selectAll('.node')
            .data(nodes)
            .enter().append('g')
            .attr('class', 'node')
            .call(d3.drag()
                .on('start', dragStarted)
                .on('drag', dragged)
                .on('end', dragEnded));

        nodeGroups.append('rect')
            .filter(d => d.shape !== 'circle')
            .attr('width', d => d.items ? d.items.concat(d).reduce((w, n) => Math.max(200, n.label.length * 10), 0) : Math.max(200, d.label.length * 10))
            .attr('height', d => d.items ? 40 + d.items.length * 20 : 40)
            .attr('fill', d => d.color || 'white')
            .attr('stroke', '#666')
            .attr('rx', 5)
            .attr('ry', 5);

        nodeGroups
            .filter(d => d.items)
            .selectAll('g')
            .data(d => d.items)
            .enter().append('g')
            .append('text')
            .attr('x', 10)
            .attr('y', (d, i) => 40 + i * 20)
            .text(d => d.label);

        nodeGroups.append('text')
            .filter(d => d.shape !== 'circle')
            .attr('x', 10)
            .attr('y', 20)
            .attr('font-weight', 'bold')
            .text(d => d.label);

        nodeGroups.append('circle')
            .filter(d => d.shape === 'circle')
            .attr('r', d => d.label.length * 2 + 20)
            .attr('fill', d => d.color || 'white')
            .attr('stroke', '#666');

        nodeGroups.append('text')
            .filter(d => d.shape === 'circle')
            .attr('x', d => -d.label.length * 2 - 20)
            .attr('y', 5)
            .attr('font-weight', 'bold')
            .text(d => d.label);

        simulation
            .nodes(nodes)
            .on('tick', () => {
                linkElements
                    .attr('x1', d => getLinkPosition(d.source, d.target))
                    .attr('y1', d => d.source.y)
                    .attr('x2', d => getLinkPosition(d.target, d.source))
                    .attr('y2', d => d.target.y);

                linkLabelElements
                    .attr('x', d => (d.link.source.x + d.link.target.x) / 2)
                    .attr('y', d => (d.link.source.y + d.link.target.y) / 2);

                svgGroup.selectAll('.node')
                    .attr('transform', d => `translate(${d.x},${d.y})`);
            });

        simulation.force('link').links(edges);

        function getNodeWidth(node) {
            return node.items ? node.items.concat(node).reduce((w, n) => Math.max(200, n.label.length * 10), 0) : Math.max(200, node.label.length * 10);
        }

        function getLinkPosition(source, target) {
            if (source.id.indexOf(target.label) === 0) {
                return source.x;
            } else if (target.id.indexOf(source.label) === 0) {
                return source.x + getNodeWidth(source);
            } else {
                return source.x + (getNodeWidth(source) / 2);
            }
        }

        function dragStarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragEnded(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }
    }
}
