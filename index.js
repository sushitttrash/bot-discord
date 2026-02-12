const { Client, GatewayIntentBits } = require("discord.js");
const fs = require("fs");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

let personagens = [];

// carregar dados
if (fs.existsSync("personagens.json")) {
  personagens = JSON.parse(fs.readFileSync("personagens.json"));
}

function salvar() {
  fs.writeFileSync("personagens.json", JSON.stringify(personagens, null, 2));
}

client.once("ready", () => {
  console.log(`Bot ligado como ${client.user.tag}`);
});

client.on("messageCreate", message => {
  if (message.author.bot) return;

  const args = message.content.split(" ");
  const comando = args.shift().toLowerCase();

  if (comando === "!add") {
    const nome = args[0];
    const vida = parseInt(args[1]);
    const vidaMax = parseInt(args[2]);

    personagens.push({ nome, vida, vidaMax });
    salvar();

    message.reply(`${nome} adicionado (${vida}/${vidaMax})`);
  }

  if (comando === "!list") {
    let texto = "**Ordem:**\n";
    personagens.forEach((p, i) => {
      texto += `${i+1}. ${p.nome} ❤️ ${p.vida}/${p.vidaMax}\n`;
    });
    message.reply(texto);
  }

  if (comando === "!damage") {
    const nome = args[0];
    const dano = parseInt(args[1]);

    const p = personagens.find(x => x.nome === nome);
    if (!p) return;

    p.vida -= dano;
    if (p.vida < 0) p.vida = 0;
    salvar();

    message.reply(`${nome} agora tem ${p.vida}/${p.vidaMax}`);
  }

  if (comando === "!heal") {
    const nome = args[0];
    const cura = parseInt(args[1]);

    const p = personagens.find(x => x.nome === nome);
    if (!p) return;

    p.vida += cura;
    if (p.vida > p.vidaMax) p.vida = p.vidaMax;
    salvar();

    message.reply(`${nome} agora tem ${p.vida}/${p.vidaMax}`);
  }
});

client.login(process.env.TOKEN);