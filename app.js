// Initialize Supabase
const SUPABASE_URL = "https://bxqlpgmqchalrfmywofc.supabase.co"; // Replace with your Supabase URL
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4cWxwZ21xY2hhbHJmbXl3b2ZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcwMzcwMjIsImV4cCI6MjA1MjYxMzAyMn0.E6kWfJqepTSrsleKr5RSttS2OCFHRaT16JqC4HMEA38"; // Replace with your Supabase Anon Key
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Handle login/signup
document.getElementById("auth-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    alert("Please fill out all fields.");
    return;
  }

  // Log in or sign up the user
  const { user, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.log("Login failed. Attempting to create a new account...");

    // Attempt sign-up if login fails
    const { error: signupError } = await supabase.auth.signUp({ email, password });

    if (signupError) {
      console.error("Sign-up failed:", signupError.message);
      alert(`Sign-up failed: ${signupError.message}`);
    } else {
      alert("Signup successful! Please confirm your email before logging in.");
    }
  } else {
    console.log("User logged in successfully:", user);
    toggleAuthState(true);
    displayKudos(); // Load kudos if login succeeds
  }
});

// Handle logout
document.getElementById("logout-button").addEventListener("click", async () => {
  if (confirm("Are you sure you want to logout?")) {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error);
    } else {
      toggleAuthState(false);
      alert("Logged out successfully!");
    }
  }
});

// Toggle UI based on auth state
function toggleAuthState(isLoggedIn) {
  document.getElementById("auth").style.display = isLoggedIn ? "none" : "block";
  document.getElementById("give-kudo").style.display = isLoggedIn ? "block" : "none";
  document.getElementById("kudo-list").style.display = isLoggedIn ? "block" : "none";
  document.getElementById("network").style.display = isLoggedIn ? "block" : "none";
  document.getElementById("logout-button").style.display = isLoggedIn ? "inline-block" : "none";
}

// Check for active session on page load
(async () => {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    console.error("Error fetching session:", error.message);
  }

  if (session) {
    console.log("User session active:", session);
    toggleAuthState(true);
    displayKudos(); // Load kudos
  } else {
    console.log("No active session. User needs to log in.");
    toggleAuthState(false);
  }
})();

// Handle form submission
document.getElementById("kudo-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const receiver = document.getElementById("receiver").value.trim();
  const message = document.getElementById("message").value.trim();

  if (!receiver || !message) {
    alert("Täytä kaikki kentät!"); // Ensure both fields are filled
    return;
  }

  try {
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Error fetching user:", userError?.message || "No user logged in.");
      alert("Error submitting kudo: User not authenticated.");
      return;
    }

    console.log("Authenticated user:", user); // Debug log

    const sender = user.email; // Use the authenticated user's email as the sender

    console.log("Inserting kudo with details:", { sender, receiver, message }); // Debug log

    // Insert the kudo into the database
    const { data, error } = await supabase
      .from("kudos")
      .insert([{ sender, receiver, message }]);

    if (error) {
      console.error("Error inserting kudo:", error.message);
      alert(`Failed to send kudo: ${error.message}`);
    } else {
      console.log("Kudo added successfully!", data);
      alert("Kudo sent!");
      displayKudos(); // Refresh the UI after a successful insert
    }

    // Clear the form
    document.getElementById("kudo-form").reset();
  } catch (err) {
    console.error("Unexpected error:", err);
    alert("An unexpected error occurred. Please try again.");
  }
});

// Display kudos in the list
async function displayKudos() {
  try {
    const { data: kudos, error } = await supabase
      .from("kudos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching kudos:", error.message);
      alert("Failed to fetch kudos.");
      return;
    }

    console.log("Fetched kudos:", kudos); // Debug log

    const kudoList = document.getElementById("kudos");
    kudoList.innerHTML = "";

    kudos.forEach((kudo) => {
      const li = document.createElement("li");
      li.textContent = `${kudo.created_at}: ${kudo.message} - Sender: ${kudo.sender}, Receiver: ${kudo.receiver}`;
      kudoList.appendChild(li);
    });
  } catch (err) {
    console.error("Unexpected error while displaying kudos:", err);
    alert("An unexpected error occurred while displaying kudos.");
  }
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

  console.log("Nodes:", nodes);
  console.log("Links:", links);

  // Display a placeholder if the graph has insufficient data
  if (nodes.length === 0 || links.length === 0) {
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

// Listen for real-time changes in the `kudos` table
supabase
  .from("kudos")
  .on("INSERT", (payload) => {
    console.log("New kudo added:", payload.new);
    displayKudos(); // Refresh the list and graph when a new kudo is added
  })
  .subscribe();

// Initialize the kudo list and graph
displayKudos();
