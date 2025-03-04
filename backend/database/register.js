document.getElementById('registerForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (password !== confirmPassword) {
        alert("Les mots de passe ne correspondent pas.");
        return;
    }

    try {
        const response = await fetch("http://localhost:3000/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
                    body: JSON.stringify({email, password })
                });
            const result = await response.json();

            if (response.ok) {
                alert(result.message);
                localStorage.setItem("isLoggedIn", "true"); 
                window.location.href = "index1.html"; 
            } else {
                alert(result.error);
            }
        } catch (error) {
            alert("Une erreur s'est produite. Veuillez réessayer.");
            console.error("Error:", error);
        }
});
document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem("isLoggedIn") === "true") {
        window.location.href = "index1.html";
    }
});