const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Bot is running!");
});

app.listen(port, () => {
  console.log(`Web server running on port ${port}`);
});
// Prevent bot from sleeping on Replit
const express = require('express');
const app = express();

app.get('/', (req, res) => res.send('Bot is alive!'));
app.listen(3000, () => console.log('✅ Web server is running on port 3000'));
require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  Partials,
  REST,
  Routes,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
  PermissionsBitField,
  Events,
  SlashCommandBuilder
} = require('discord.js');

const TOKEN     = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID  = process.env.GUILD_ID;

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  partials: [Partials.Channel]
});

// Register /ticket-embed command with channel selection
(async () => {
  const rest = new REST({ version: '10' }).setToken(TOKEN);
  try {
    console.log('Registering /ticket-embed...');
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      {
        body: [
          new SlashCommandBuilder()
            .setName('ticket-embed')
            .setDescription('Send the ticket embed in a selected channel')
            .addChannelOption(option =>
              option.setName('channel')
                .setDescription('Channel to send the ticket embed')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)
            )
            .toJSON()
        ]
      }
    );
    console.log('✅ /ticket-embed registered');
  } catch (err) {
    console.error('❌ Failed to register commands', err);
  }
})();

client.once(Events.ClientReady, () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// Modal-to-category map
const ticketMap = {
  modal_general_support: {
    cat: '1368944827852525610',
    name: 'gen-sup',
    thanks: 'Thanks for creating your General Support ticket. Our staff will assist you ASAP.',
    fields: [
      ['Minecraft IGN', 'ign'],
      ['Issue', 'issue'],
      ['Tried troubleshooting?', 'troubleshoot'],
      ['Screenshots/logs?', 'logs'],
      ['Affecting others?', 'others']
    ]
  },
  modal_staff_app: {
    cat: '1368944897062867024',
    name: 'staff-app',
    thanks: 'Thanks for your Staff Application. We will review it shortly.',
    fields: [
      ['Minecraft IGN', 'ign'],
      ['Age', 'age'],
      ['Why staff?', 'why'],
      ['Experience?', 'exp'],
      ['Hours/week?', 'hours']
    ]
  },
  modal_report_staff: {
    cat: '1368944951337029766',
    name: 'staff-repo',
    thanks: 'Thanks for reporting. Our team will investigate.',
    fields: [
      ['Your IGN', 'ign'],
      ['Staff reported', 'staff'],
      ['Reason', 'reason'],
      ['Evidence', 'evidence']
    ]
  },
  modal_punishment_appeal: {
    cat: '1368945006987055175',
    name: 'punis-app',
    thanks: 'Thanks for your appeal. We will get back soon.',
    fields: [
      ['Your IGN', 'ign'],
      ['Staff who punished you', 'staff'],
      ['Punishment type', 'type'],
      ['Appeal reason', 'reason']
    ]
  }
};

client.on(Events.InteractionCreate, async interaction => {
  // Slash command: ticket-embed
  if (interaction.isChatInputCommand() && interaction.commandName === 'ticket-embed') {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return interaction.reply({ content: 'Admin only.', ephemeral: true });

    const targetChannel = interaction.options.getChannel('channel');
    if (!targetChannel || targetChannel.type !== ChannelType.GuildText)
      return interaction.reply({ content: 'Invalid channel.', ephemeral: true });

    const embed = new EmbedBuilder()
      .setTitle('MINEREL SUPPORT')
      .setDescription([
        'All of the given rules must be followed in ticket:',
        '1. Respect Staff',
        '2. No Spam',
        '3. Use for Serious Issues',
        '4. No Abusive Language'
      ].join('\n'))
      .setColor(0x00AE86)
      .setThumbnail('https://cdn.discordapp.com/attachments/1217826622913122345/1369238278636830801/minecraft_title.png?ex=681b2204&is=6819d084&hm=170410867144c116fe44510a01e9fbfbb6b6fc5ecf29e0c518d379fe41763087&')
      .setImage('https://cdn.discordapp.com/attachments/1217826622913122345/1369234371751706654/Minerel_support_2.jpg?ex=681b1e61&is=6819cce1&hm=306a4c9e793546772a49f2fb4b658e9fa6adf99aa8d9bc1da2926e8f33b26823&');

    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('ticket-select')
        .setPlaceholder('Choose a Category to create ticket')
        .addOptions([
          { label: 'General Support', value: 'general_support', description: 'Get help with general issues.', emoji: { id: '1369254733566705674' } },
          { label: 'Staff Applications', value: 'staff_applications', description: 'Apply to be staff.', emoji: { id: '1342488104207908945' } },
          { label: 'Report a Staff', value: 'report_staff', description: 'Report a staff member.', emoji: { id: '1342487348792918016' } },
          { label: 'Punishment Appeal', value: 'punishment_appeal', description: 'Appeal a mute/ban.', emoji: { id: '1369254737031204925' } }
        ])
    );

    await targetChannel.send({ embeds: [embed], components: [menu] });
    await interaction.reply({ content: `✅ Embed sent to ${targetChannel}`, ephemeral: true });
    return;
  }

  // Handle dropdown
  if (interaction.isStringSelectMenu() && interaction.customId === 'ticket-select') {
    const modals = {
      general_support: new ModalBuilder().setCustomId('modal_general_support').setTitle('General Support')
        .addComponents(
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('ign').setLabel('Minecraft IGN').setStyle(TextInputStyle.Short).setRequired(true)),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('issue').setLabel('What issue are you experiencing?').setStyle(TextInputStyle.Paragraph).setRequired(true)),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('troubleshoot').setLabel('Tried troubleshooting?').setStyle(TextInputStyle.Short)),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('logs').setLabel('Screenshots/logs?').setStyle(TextInputStyle.Paragraph)),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('others').setLabel('Affecting others?').setStyle(TextInputStyle.Short))
        ),
      staff_applications: new ModalBuilder().setCustomId('modal_staff_app').setTitle('Staff Application')
        .addComponents(
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('ign').setLabel('Minecraft IGN').setStyle(TextInputStyle.Short).setRequired(true)),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('age').setLabel('Your age').setStyle(TextInputStyle.Short)),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('why').setLabel('Why staff?').setStyle(TextInputStyle.Paragraph)),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('exp').setLabel('Experience?').setStyle(TextInputStyle.Paragraph)),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('hours').setLabel('Hours/week?').setStyle(TextInputStyle.Short))
        ),
      report_staff: new ModalBuilder().setCustomId('modal_report_staff').setTitle('Report a Staff')
        .addComponents(
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('ign').setLabel('Your IGN').setStyle(TextInputStyle.Short).setRequired(true)),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('staff').setLabel('Staff IGN').setStyle(TextInputStyle.Short).setRequired(true)),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('reason').setLabel('Reason').setStyle(TextInputStyle.Paragraph)),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('evidence').setLabel('Evidence?').setStyle(TextInputStyle.Paragraph))
        ),
      punishment_appeal: new ModalBuilder().setCustomId('modal_punishment_appeal').setTitle('Punishment Appeal')
        .addComponents(
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('ign').setLabel('Your IGN').setStyle(TextInputStyle.Short).setRequired(true)),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('staff').setLabel('Staff who punished you').setStyle(TextInputStyle.Short)),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('type').setLabel('Mute or Ban?').setStyle(TextInputStyle.Short)),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('reason').setLabel('Why accept appeal?').setStyle(TextInputStyle.Paragraph))
        )
    };
    await interaction.showModal(modals[interaction.values[0]]);
    return;
  }

  // Modal submission → ticket channel
  if (interaction.isModalSubmit()) {
    await interaction.deferReply({ ephemeral: true });
    const info = ticketMap[interaction.customId]; if (!info) return;
    const user = interaction.user;

    const chan = await interaction.guild.channels.create({
      name: `${info.name}-${user.username.toLowerCase()}`,
      type: ChannelType.GuildText,
      parent: info.cat,
      permissionOverwrites: [
        { id: interaction.guild.roles.everyone, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
      ]
    });

    const thank = new EmbedBuilder().setColor(0x00AE86).setTitle('Ticket Created').setDescription(info.thanks);
    const form = new EmbedBuilder().setColor(0x2F3136).setTitle('Your Submitted Information');
    info.fields.forEach(([q, id]) => form.addFields({ name: q, value: `\`${interaction.fields.getTextInputValue(id) || 'N/A'}\`` }));
    const btn = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('close_ticket').setLabel('Close Ticket').setStyle(ButtonStyle.Danger));
    await chan.send({ content: `<@${user.id}>`, embeds: [thank, form], components: [btn] });
    await interaction.editReply({ content: `✅ Ticket created: ${chan}`, embeds: [], components: [] });
    return;
  }

  // Close ticket button
  if (interaction.isButton() && interaction.customId === 'close_ticket') {
    await interaction.deferReply({ ephemeral: true });
    if (!interaction.member.roles.cache.has('1361555359944282162')) return interaction.editReply({ content: '❌ No permission to close.' });
    const ticketChan = interaction.channel;
    await ticketChan.send('🔒 Ticket closed.');
    await ticketChan.delete();
    return interaction.editReply({ content: '✅ Ticket closed.' });
  }
});

client.login(TOKEN);
