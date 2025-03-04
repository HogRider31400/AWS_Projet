import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import http from "http";
import { Server as SocketIOServer } from "socket.io";

const saltRounds = 10;

const app = express();

app.use(cors({
    origin: "http://127.0.0.1:5501",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
}));

const prisma = new PrismaClient();
const PORT = 3000;

(async () => {
    try {
        await prisma.$connect();
        console.log("Connexion à SQLite réussie !");
    } catch (error) {
        console.error("Erreur de connexion à SQLite :", error);
    }
})();


// Créer le serveur HTTP
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: "http://127.0.0.1:5501",
    methods: ["GET", "POST"]
  }
});

let lobbies = {}; // Objet pour stocker les lobbies et leurs joueurs

io.on('connection', (socket) => {
    console.log('Nouvel utilisateur connecté :', socket.id);

    socket.on('joinRoom', (data) => {
        const { room, pseudo, characterBg } = data;
        socket.join(room);

        if (!lobbies[room]) {
            lobbies[room] = [];
        }
        lobbies[room].push({ pseudo, characterBg, id: socket.id });
        io.to(room).emit('updateLobby', lobbies[room]);
    });

    socket.on('disconnect', () => {
        for (let room in lobbies) {
            lobbies[room] = lobbies[room].filter(player => player.id !== socket.id);
            io.to(room).emit('updateLobby', lobbies[room]);
        }
        console.log('Utilisateur déconnecté :', socket.id);
    });
});


app.use(express.json());

app.post("/register", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Tous les champs sont requis." });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    try {
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
            },
        });
        res.status(201).json({ message: "Inscription réussie !" });
    } catch (error) {
        res.status(400).json({ error: "Email déjà utilisé." });
    }
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        return res.status(400).json({ error: "Utilisateur non trouvé" });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
        return res.status(400).json({ error: "Mot de passe incorrect" });
    }

    res.json({ message: "Connexion réussie !" });
});

app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
