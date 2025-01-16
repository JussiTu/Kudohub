document.getElementById("kudo-form").addEventListener("submit", function (e) {
  e.preventDefault();

  const receiver = document.getElementById("receiver").value;
  const message = document.getElementById("message").value;

  let kudos = JSON.parse(localStorage.getItem("kudos")) || [];
  kudos.push({ receiver, message, date: new Date().toISOString() });
  localStorage.setItem("kudos", JSON.stringify(kudos));

  displayKudos();
});

function displayKudos() {
  const kudos = JSON.parse(localStorage.getItem("kudos")) || [];
  const kudoList = document.getElementById("kudos");
  kudoList.innerHTML = "";

  kudos.forEach((kudo) => {
    const li = document.createElement("li");
    li.textContent = `${kudo.date}: ${kudo.message} - Saaja: ${kudo.receiver}`;
    kudoList.appendChild(li);
  });
}

displayKudos();
