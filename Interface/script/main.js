const app = Vue.createApp({
    data() {
        return {
            isMenuOpen: false,
            scrolled: false
        };
    },
    methods: {
        toggleMenu() {
            this.isMenuOpen = !this.isMenuOpen;
        },
        handleScroll() {
            this.scrolled = window.scrollY > 50;
        }
    },
    mounted() {
        window.addEventListener('scroll', this.handleScroll);
    },
    beforeUnmount() {
        window.removeEventListener('scroll', this.handleScroll);
    }
});

document.addEventListener("DOMContentLoaded", () => {
    document.querySelector(".cta-button").addEventListener("click", () => {
        window.location.href = "personnage.html";
    });
});

app.mount("#app");
