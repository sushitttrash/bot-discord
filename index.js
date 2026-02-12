const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const fs = require("fs");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

let personagens = [];
let turnoAtual = 0;

if (fs.existsSync("personagens.json")) {
  personagens = JSON.parse(fs.readFileSync("personagens.json"));
}

function salvar() {
  fs.writeFileSync("personagens.json", JSON.stringify(personagens, null, 2));
}

function rolarDado(expressao) {
  const match = expressao.match(/(\d+)d(\d+)/);
  if (!match) return null;

  const qtd = parseInt(match[1]);
  const faces = parseInt(match[2]);

  let total = 0;
  let resultados = [];

  for (let i = 0; i < qtd; i++) {
    const roll = Math.floor(Math.random() * faces) + 1;
    resultados.push(roll);
    total += roll;
  }

  return { total, resultados };
}

client.once("clientReady", () => {
  console.log(`Bot ligado como ${client.user.tag}`);
});

client.on("messageCreate", message => {
  if (message.author.bot) return;

  const args = message.content.split(" ");
  const comando = args.shift().toLowerCase();

  // =========================
  // ADD NORMAL
  // =========================
  if (comando === "!add") {
    const nome = args[0];
    const vida = parseInt(args[1]);
    const vidaMax = parseInt(args[2]);

    personagens.push({ nome, vida, vidaMax, init: 0, tag: "" });
    salvar();

    message.reply(`${nome} entrou no combate (${vida}/${vidaMax})`);
    return;
  }

  // =========================
  // ADD BOSS
  // =========================
  if (comando === "!boss") {
    const nome = args[0];
    const vida = parseInt(args[1]);
    const vidaMax = parseInt(args[2]);

    personagens.push({ nome, vida, vidaMax, init: 0, tag: "BOSS" });
    salvar();

    message.reply(`${nome} entrou como BOSS 👑`);
    return;
  }

  // =========================
  // ADD NPC
  // =========================
  if (comando === "!npc") {
    const nome = args[0];
    const vida = parseInt(args[1]);
    const vidaMax = parseInt(args[2]);

    personagens.push({ nome, vida, vidaMax, init: 0, tag: "NPC" });
    salvar();

    message.reply(`${nome} entrou como NPC 🤖`);
    return;
  }

  // =========================
  // REMOVE
  // =========================
  if (comando === "!remove") {
    const nome = args[0];
    personagens = personagens.filter(p => p.nome !== nome);
    salvar();
    message.reply(`${nome} removido do combate.`);
    return;
  }

  // =========================
  // VIDA
  // =========================
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

  // =========================
  // INICIATIVA MANUAL
  // =========================
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

  // =========================
  // INICIATIVA AUTOMÁTICA (1d20)
  // =========================
  if (comando === "!rollinit") {
    personagens.forEach(p => {
      p.init = Math.floor(Math.random() * 20) + 1;
    });

    personagens.sort((a, b) => b.init - a.init);
    turnoAtual = 0;
    salvar();

    message.reply("🎲 Iniciativas roladas automaticamente!");
    return;
  }

  // =========================
  // ORDENAR AUTOMÁTICO
  // =========================
  if (comando === "!start") {
    personagens.sort((a, b) => b.init - a.init);
    turnoAtual = 0;
    salvar();
    message.reply("Iniciativa ordenada!");
    return;
  }

  // =========================
  // ORDENAR MANUAL
  // =========================
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

  // =========================
  // PRÓXIMO TURNO
  // =========================
  if (comando === "!next") {
    if (personagens.length === 0) return;

    turnoAtual++;
    if (turnoAtual >= personagens.length) turnoAtual = 0;

    message.reply(`👉 Turno de: **${personagens[turnoAtual].nome}**`);
    return;
  }

  // =========================
  // TURNO ATUAL
  // =========================
  if (comando === "!turno") {
    if (personagens.length === 0) return;
    message.reply(`👉 Turno atual: **${personagens[turnoAtual].nome}**`);
    return;
  }

  // =========================
  // ROLL DADO
  // =========================
  if (comando === "!roll") {
    const expressao = args[0];
    const resultado = rolarDado(expressao);

    if (!resultado) {
      message.reply("Use formato tipo: !roll 1d20");
      return;
    }

    message.reply(`🎲 ${expressao} → [${resultado.resultados.join(", ")}] = **${resultado.total}**`);
    return;
  }

  // =========================
  // LISTA BONITA
  // =========================
  if (comando === "!list") {

    if (personagens.length === 0) {
      message.reply("Nenhum personagem na iniciativa.");
      return;
    }

    let texto = "";

    personagens.forEach((p, i) => {
      let marcador = (i === turnoAtual) ? "👉 " : "";
      let tag = p.tag ? ` [${p.tag}]` : "";

      texto += `${marcador}**${i+1}º ${p.nome}**${tag} — [${p.vida}/${p.vidaMax}] (Init ${p.init})\n`;
    });

    const embed = new EmbedBuilder()
      .setTitle("⚔️ Iniciativa Atual 🎲")
      .setDescription(texto)
      .setColor(0x8b0000);

    message.reply({ embeds: [embed] });
    return;
  }

  // =========================
  // RESET
  // =========================
  if (comando === "!reset") {
    personagens = [];
    turnoAtual = 0;
    salvar();
    message.reply("Combate resetado.");
    return;
  }

});

client.login(process.env.TOKEN);
