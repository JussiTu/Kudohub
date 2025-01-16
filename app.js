// Initialize Supabase
const SUPABASE_URL = "https://bxqlpgmqchalrfmywofc.supabase.co"; // Replace with your Supabase URL
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4cWxwZ21xY2hhbHJmbXl3b2ZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcwMzcwMjIsImV4cCI6MjA1MjYxMzAyMn0.E6kWfJqepTSrsleKr5RSttS2OCFHRaT16JqC4HMEA38"; // Replace with your Supabase Anon Key
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Handle form submission
document.getElementById("kudo-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const receiver = document.getElementById("receiver").value.trim();
  const message = document.getElementById("message").value.trim();

  if (!receiver || !message) {
    alert("Täytä kaikki kentät!");
    return;
  }

  // Insert data into Supabase
  const { data, error } = await supabase
    .from("kudos")
    .insert([{ sender: "You", receiver, message }]);

  if (error) {
    console.error("Error inserting kudo:", error);
    alert("Error adding kudo. Please try again.");
  } else {
    console.log("Kudo added:", data);
    displayKudos(); // Refresh the kudo list and graph
  }

  // Clear the form
  document.getElementById("kudo-form").reset();
});

// Display kudos in the list and update the graph
async function displayKudos() {
  const { data: kudos, error } = await supabase
    .from("kudos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching kudos:", error);
    alert("Error fetching kudos. Please try again.");
    return;
  }

  const kudoList = document.getElementById("kudos");
  kudoList.innerHTML = "";

  kudos.forEach((kudo) => {
    const li = document.createElement("li");
    li.textContent = `${kudo.created_at}: ${kudo.message} - Saaja: ${kudo.receiver}`;
    kudoList.appendChild(li);
  });

  // Update the graph with the latest kudos data
  buildGraph(kudos);
}

// Build the network graph
function buildGraph(kudos) {
  const nodes = [];
  const links = [];

  // Create nodes and links
  kudos.forEach((kudo) => {
    if (!nodes.some((node) => node.id === kudo.receiver)) {
      nodes.push({ id: kudo.receiver });
    }
    if (!nodes.some((node) => node.id === kudo.sender)) {
      nodes.push({ id: kudo.sender });
    }
    links.push({ source: kudo.sender, target: kudo.receiver });
  });

  console.log("Nodes:", nodes); // Debugging nodes
  console.log("Links:", links); // Debugging links

  // Display a placeholder if the graph has insufficient data
  if (nodes.length === 0 || links.length === 0) {
    console.warn("Insufficient data for the graph. Waiting for more kudos.");
    document.getElementById("network-graph").innerHTML =
      "<p>No network data to display. Add more kudos!</p>";
    return;
  }

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

// Initialize the kudo list and graph
displayKudos();
