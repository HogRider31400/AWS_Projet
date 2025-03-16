document.querySelector('form').addEventListener('submit', async function(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const response = await fetch("/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
    });

    const result = await response.json();
    if (response.ok) {
        //alert("Connexion réussie !");
        localStorage.setItem("isLoggedIn", "true"); 
        window.location.href = "/"; 
    } else {
        alert("Échec de la connexion : " + result.error);
    }
});