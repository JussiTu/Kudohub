// Handle form submission
document.getElementById("kudo-form").addEventListener("submit", function (e) {
  e.preventDefault();

  const receiver = document.getElementById("receiver").value.trim();
  const message = document.getElementById("message").value.trim();

  if (!receiver || !message) {
    alert("Täytä kaikki kentät!"); // Alert for empty fields
    return;
  }

  let kudos = JSON.parse(localStorage.getItem("kudos")) || [];
  kudos.push({ receiver, message, date: new Date().toLocaleString() });
  localStorage.setItem("kudos", JSON.stringify(kudos));

  displayKudos();
  buildGraph();

  // Clear the form
  document.getElementById("kudo-form").reset();
});

// Display kudos in the list
function displayKudos() {
  const kudos = JSON.parse(localStorage.getItem("kudos")) || [];
  const kudoList = document.getElementById("kudos");
  kudoList.innerHTML = "";

  if (kudos.length === 0) {
    kudoList.innerHTML = "<li>Ei kudos vielä!</li>";
    return;
  }

  kudos.forEach((kudo) => {
    const li = document.createElement("li");
    li.textContent = `${kudo.date}: ${kudo.message} - Saaja: ${kudo.receiver}`;
    kudoList.appendChild(li);
  });
}

// Build the network graph
function buildGraph() {
  const kudos = JSON.parse(localStorage.getItem("kudos")) || [];
  const nodes = [];
  const links = [];

  // Create nodes and links
  kudos.forEach((kudo) => {
    if (!nodes.some((node) => node.id === kudo.receiver)) {
      nodes.push({ id: kudo.receiver });
    }
    if (!nodes.some((node) => node.id === "You")) {
      nodes.push({ id: "You" });
    }
    links.push({ source: "You", target: kudo.receiver });
  });

  const width = 800;
  const height = 600;

  // Clear the previous graph
  document.getElementById("network-graph").innerHTML = "";

  const svg = d3
    .select("#network-graph")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const simulation = d3
    .forceSimulation(nodes)
    .force("link", d3.forceLink(links).id((d) => d.id).distance(100))
    .force("charge", d3.forceManyBody().strength(-300))
    .force("center", d3.forceCenter(width / 2, height / 2));

  const link = svg
    .append("g")
    .selectAll("line")
    .data(links)
    .enter()
    .append("line")
    .attr("stroke-width", 2)
    .attr("stroke", "#999");

  const node = svg
    .append("g")
    .selectAll("circle")
    .data(nodes)
    .enter()
    .append("circle")
    .attr("r", 10)
    .attr("fill", "#69b3a2")
    .call(
      d3
        .drag()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
    );

  const text = svg
    .append("g")
    .selectAll("text")
    .data(nodes)
    .enter()
    .append("text")
    .attr("x", 12)
    .attr("y", 3)
    .text((d) => d.id)
    .style("font-size", "12px")
    .style("fill", "#555");

  simulation.on("tick", () => {
    link
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);

    node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);

    text.attr("x", (d) => d.x + 12).attr("y", (d) => d.y + 3);
  });
}

// Initialize
displayKudos();
buildGraph();
