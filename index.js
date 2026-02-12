const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const fs = require("fs");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

let personagens = [];
let turnoAtual = 0;

if (fs.existsSync("personagens.json")) {
  personagens = JSON.parse(fs.readFileSync("personagens.json"));
}

function salvar() {
  fs.writeFileSync("personagens.json", JSON.stringify(personagens, null, 2));
}

client.once("clientReady", () => {
  console.log(`Bot ligado como ${client.user.tag}`);
});

client.on("messageCreate", message => {
  if (message.author.bot) return;

  const args = message.content.split(" ");
  const comando = args.shift().toLowerCase();

  // ADD
  if (comando === "!add") {
    const nome = args[0];
    const vida = parseInt(args[1]);
    const vidaMax = parseInt(args[2]);

    personagens.push({ nome, vida, vidaMax, init: 0 });
    salvar();
    message.reply(`${nome} entrou na iniciativa (${vida}/${vidaMax})`);
    return;
  }

  // VIDA
  if (comando === "!hp") {
    const nome = args[0];
    const valor = parseInt(args[1]);

    const p = personagens.find(x => x.nome === nome);
    if (!p) return;

    p.vida += valor;
    if (p.vida > p.vidaMax) p.vida = p.vidaMax;
    if (p.vida < 0) p.vida = 0;

    salvar();
    message.reply(`${nome} agora está com ${p.vida}/${p.vidaMax}`);
    return;
  }

  // INICIATIVA
  if (comando === "!init") {
    const nome = args[0];
    const valor = parseInt(args[1]);

    const p = personagens.find(x => x.nome === nome);
    if (!p) return;

    p.init = valor;
    salvar();
    message.reply(`${nome} recebeu iniciativa ${valor}`);
    return;
  }

  // ORDENAR AUTOMÁTICO
  if (comando === "!start") {
    personagens.sort((a, b) => b.init - a.init);
    turnoAtual = 0;
    salvar();
    message.reply("Iniciativa ordenada automaticamente!");
    return;
  }

  // MOVER MANUALMENTE
  if (comando === "!move") {
    const nome = args[0];
    const pos = parseInt(args[1]) - 1;

    const index = personagens.findIndex(p => p.nome === nome);
    if (index === -1) return;

    const personagem = personagens.splice(index, 1)[0];
    personagens.splice(pos, 0, personagem);

    salvar();
    message.reply(`${nome} movido para posição ${pos+1}`);
    return;
  }

  // PROXIMO TURNO
  if (comando === "!next") {
    turnoAtual++;
    if (turnoAtual >= personagens.length) turnoAtual = 0;

    message.reply(`Turno de: **${personagens[turnoAtual].nome}**`);
    return;
  }

  // TURNO ATUAL
  if (comando === "!turno") {
    if (personagens.length === 0) return;
    message.reply(`Turno de: **${personagens[turnoAtual].nome}**`);
    return;
  }

  // LISTA BONITA
  if (comando === "!list") {
    let texto = "";

    personagens.forEach((p, i) => {
      let marcador = (i === turnoAtual) ? "👉 " : "";
      texto += `${marcador}**${i+1}º ${p.nome}** — [${p.vida}/${p.vidaMax}] (Init ${p.init})\n`;
    });

    const embed = new EmbedBuilder()
      .setTitle("⚔️ Iniciativa Atual 🎲")
      .setDescription(texto)
      .setColor(0x8b0000);

    message.reply({ embeds: [embed] });
    return;
  }

  // RESET
  if (comando === "!reset") {
    personagens = [];
    turnoAtual = 0;
    salvar();
    message.reply("Combate resetado.");
    return;
  }

});
client.login(process.env.TOKEN);
