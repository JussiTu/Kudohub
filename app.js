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
    displayKudos(); // Refresh the kudo list
  }

  // Clear the form
  document.getElementById("kudo-form").reset();
});

// Display kudos in the list
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
}

// Initialize the kudo list
displayKudos();
