#!/usr/bin/env node
// =================================================================
// ========== WHATSAPP AUTOMATION - TERMUX EDITION ================
// =================================================================
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const readline = require('readline');
const os = require('os');

// === YAPILANDIRMA ===
const CONFIG = {
  licenseKey: 'emo5869',
  repoOwner: 'Powerss1',
  repoName: 'Puto',
  branch: 'main',
  secretFileName: 'secret.txt',
  versionFileName: 'version.txt',
  filesToUpdate: ['bot.js', 'config.json', 'package.json', 'README.md']
};

// === RENKLER ===
const colors = {
  reset: '\x1b[0m',
  grey: '\x1b[90m',
  white: '\x1b[37m',
  cyan: '\x1b[36m',
  green: '\x1b[92m',
  yellow: '\x1b[93m',
  red: '\x1b[91m'
};

// === TERMUX KONTROLÜ ===
const isTermux = () => {
  return process.env.PREFIX && process.env.PREFIX.includes('com.termux');
};

// === GRADİENT EFEKT ===
function greyGradient(text, offset = 0) {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const wave = Math.sin((i + offset) * 0.15);
    const brightness = Math.floor(180 + (wave * 75));
    result += `\x1b[38;2;${brightness};${brightness};${brightness}m${text[i]}`;
  }
  return result + colors.reset;
}

const clearScreen = () => process.stdout.write('\x1Bc');

// === HTTPS YARDIMCI FONKSİYONLAR ===
function fetchString(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data.trim()));
    }).on('error', () => resolve(null));
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      res.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve(true));
      });
    }).on('error', () => {
      fs.unlink(dest, () => resolve(false));
    });
  });
}

function checkFileExists(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => resolve(false));
  });
}

// === LİSANS KONTROLÜ ===
async function checkLicense() {
  console.log(greyGradient("\n    🔐 Lisans doğrulanıyor...", 0));
  
  const secretUrl = `https://raw.githubusercontent.com/${CONFIG.repoOwner}/${CONFIG.repoName}/${CONFIG.branch}/${CONFIG.secretFileName}`;
  const exists = await checkFileExists(secretUrl);
  
  if (!exists) {
    console.log(`\n    ${colors.red}❌ LİSANS DOĞRULANAMADI!${colors.reset}`);
    console.log(`    ${colors.grey}Sunucuya erişilemiyor veya lisans geçersiz.${colors.reset}\n`);
    process.exit(1);
  }
  
  console.log(`    ${colors.green}✅ Lisans doğrulandı!${colors.reset}`);
  return true;
}

// === SESSİZ GÜNCELLEME KONTROLÜ ===
async function checkForUpdatesQuiet() {
  if (!fs.existsSync('version.txt')) fs.writeFileSync('version.txt', '1.0');
  let localVer = parseFloat(fs.readFileSync('version.txt', 'utf8'));
  if (isNaN(localVer)) localVer = 1.0;
  
  const versionUrl = `https://raw.githubusercontent.com/${CONFIG.repoOwner}/${CONFIG.repoName}/${CONFIG.branch}/${CONFIG.versionFileName}`;
  const remoteVerStr = await fetchString(versionUrl);
  
  if (!remoteVerStr) {
    console.log(`${colors.yellow}⚠️  [Güncelleme] Sunucuya erişilemedi${colors.reset}`);
    return;
  }
  
  const remoteVer = parseFloat(remoteVerStr);
  
  if (remoteVer > localVer) {
    console.log(`${colors.cyan}⬇️  [Güncelleme] Yeni sürüm bulundu: v${remoteVer}${colors.reset}`);
    
    for (const file of CONFIG.filesToUpdate) {
      const fileUrl = `https://raw.githubusercontent.com/${CONFIG.repoOwner}/${CONFIG.repoName}/${CONFIG.branch}/${file}`;
      const success = await downloadFile(fileUrl, file);
      if (success) console.log(`${colors.green}✅ [Güncelleme] ${file} indirildi${colors.reset}`);
    }
    
    fs.writeFileSync('version.txt', remoteVer.toString());
    console.log(`${colors.green}✅ [Güncelleme] Tamamlandı, yeniden başlatılıyor...${colors.reset}`);
    
    await new Promise(r => setTimeout(r, 2000));
    process.exit(0);
  } else {
    console.log(`${colors.green}✅ [Güncelleme] Sistem güncel (v${localVer})${colors.reset}`);
  }
}

// === GİRİŞ EKRANI ===
async function showLoginScreen() {
  // Otomatik mod kontrolü
  if (process.env.AUTO_RESTART === 'true') {
    console.log(`${colors.cyan}🔄 [Sistem] Otomatik yeniden başlatma${colors.reset}`);
    console.log(`${colors.green}✅ [Lisans] Otomatik doğrulama${colors.reset}`);
    
    const secretUrl = `https://raw.githubusercontent.com/${CONFIG.repoOwner}/${CONFIG.repoName}/${CONFIG.branch}/${CONFIG.secretFileName}`;
    const exists = await checkFileExists(secretUrl);
    
    if (!exists) {
      console.log(`${colors.red}❌ [Lisans] Doğrulanamadı!${colors.reset}`);
      process.exit(1);
    }
    
    console.log(`${colors.green}✅ [Lisans] Doğrulandı${colors.reset}`);
    await checkForUpdatesQuiet();
    console.log(`${colors.cyan}🚀 [Bot] Başlatılıyor...${colors.reset}\n`);
    startBot();
    return;
  }
  
  clearScreen();
  console.log("\n\n");
  console.log(greyGradient("    ██╗    ██╗██╗  ██╗ █████╗ ████████╗███████╗ █████╗ ██████╗ ██████╗ ", 0));
  console.log(greyGradient("    ██║    ██║██║  ██║██╔══██╗╚══██╔══╝██╔════╝██╔══██╗██╔══██╗██╔══██╗", 5));
  console.log(greyGradient("    ██║ █╗ ██║███████║███████║   ██║   ███████╗███████║██████╔╝██████╔╝", 10));
  console.log(greyGradient("    ██║███╗██║██╔══██║██╔══██║   ██║   ╚════██║██╔══██║██╔═══╝ ██╔═══╝ ", 15));
  console.log(greyGradient("    ╚███╔███╔╝██║  ██║██║  ██║   ██║   ███████║██║  ██║██║     ██║     ", 20));
  console.log(greyGradient("     ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝     ", 25));
  console.log(greyGradient("\n              WHATSAPP AUTOMATION - TERMUX EDITION", 30));
  console.log(greyGradient("              ════════════════════════════════════════\n", 35));
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question(greyGradient('    🔑 LİSANS ANAHTARI: ', 0), async (key) => {
    if (key.trim() !== CONFIG.licenseKey) {
      console.log(`\n    ${colors.red}❌ Hatalı Anahtar!${colors.reset}\n`);
      process.exit(0);
    }
    
    console.log(`\n    ${colors.green}✅ Giriş Başarılı!${colors.reset}`);
    await checkLicense();
    await checkForUpdatesQuiet();
    
    rl.close();
    
    console.log(`\n    ${colors.cyan}🚀 Bot başlatılıyor...${colors.reset}\n`);
    await new Promise(r => setTimeout(r, 1000));
    
    startBot();
  });
}

// === MODÜL KONTROLÜ ===
function checkAndInstallModules() {
  console.log(`${colors.cyan}🔍 [Sistem] Modül kontrolü yapılıyor...${colors.reset}\n`);
  
  const requiredModules = [
    'node-telegram-bot-api',
    'whatsapp-web.js',
    'qrcode-terminal',
    'node-cron'
  ];
  
  let missing = [];
  for (const mod of requiredModules) {
    try {
      require.resolve(mod);
      console.log(`${colors.green}✅ [Modül] ${mod} kurulu${colors.reset}`);
    } catch (e) {
      missing.push(mod);
    }
  }
  
  if (missing.length > 0) {
    console.log(`\n${colors.yellow}📦 [Kurulum] Eksik modüller yükleniyor...${colors.reset}\n`);
    try {
      execSync(`npm install ${missing.join(' ')}`, { stdio: 'inherit' });
      console.log(`\n${colors.green}✅ [Kurulum] Tamamlandı!${colors.reset}\n`);
    } catch (err) {
      console.log(`${colors.red}❌ [Kurulum] Başarısız!${colors.reset}\n`);
      process.exit(1);
    }
  } else {
    console.log(`\n${colors.green}✅ [Sistem] Tüm modüller kurulu${colors.reset}\n`);
  }
}

// === ANA BOT KODU ===
function startBot() {
  checkAndInstallModules();
  
  const TelegramBot = require('node-telegram-bot-api');
  const { Client, LocalAuth } = require('whatsapp-web.js');
  const qrcode = require('qrcode-terminal');
  const cron = require('node-cron');
  
  const CONFIG_FILE = path.join(__dirname, 'config.json');
  const MAX_CONSOLE_LINES = 100;
  const SESSION_TIMEOUT = 30 * 60 * 1000;
  
  let config = {};
  try {
    config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    if (!config.stats.startTime) {
      config.stats.startTime = new Date().toISOString();
      config.stats.lastRestart = new Date().toISOString();
    } else {
      config.stats.lastRestart = new Date().toISOString();
    }
    console.log(`${colors.green}✅ [Config] Yüklendi${colors.reset}`);
  } catch (e) {
    console.error(`${colors.red}❌ [Config] Yüklenemedi: ${e.message}${colors.reset}`);
    process.exit(1);
  }
  
  const TELEGRAM_TOKEN = config.telegram.token;
  const ADMIN_ID = config.telegram.adminId;
  const ADMIN_PIN = config.telegram.adminPin;
  
  const telegramBot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
  
  // TERMUX İÇİN OPTİMİZE EDİLMİŞ WHATSAPP CLIENT
  console.log(`${colors.cyan}📱 [WhatsApp] Client yapılandırılıyor...${colors.reset}`);
  
  const whatsappClient = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    }
  });
  
  if (isTermux()) {
    console.log(`${colors.green}✅ [Termux] Termux modu aktif${colors.reset}`);
  }
  
  let consoleBuffer = [];
  let userStates = {};
  
  function saveConfig() {
    try {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    } catch (e) {
      console.error(`${colors.red}❌ [Config] Kayıt hatası${colors.reset}`);
    }
  }
  
  const originalLog = console.log;
  const originalError = console.error;
  
  console.log = function(...args) {
    const msg = args.join(' ');
    consoleBuffer.push({ time: new Date().toISOString(), type: 'log', message: msg });
    if (consoleBuffer.length > MAX_CONSOLE_LINES) consoleBuffer.shift();
    originalLog.apply(console, args);
  };
  
  console.error = function(...args) {
    const msg = args.join(' ');
    consoleBuffer.push({ time: new Date().toISOString(), type: 'error', message: msg });
    if (consoleBuffer.length > MAX_CONSOLE_LINES) consoleBuffer.shift();
    originalError.apply(console, args);
  };
  
  function isAdmin(userId) {
    return userId.toString() === ADMIN_ID.toString();
  }
  
  function checkAdminSession(userId) {
    const session = config.adminSessions[userId];
    if (!session) return false;
    if (Date.now() - session.loginTime > SESSION_TIMEOUT) {
      delete config.adminSessions[userId];
      saveConfig();
      return false;
    }
    return true;
  }
  
  function createAdminSession(userId) {
    config.adminSessions[userId] = { loginTime: Date.now() };
    saveConfig();
  }
  
  function formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}g ${hours % 24}s`;
    if (hours > 0) return `${hours}s ${minutes % 60}d`;
    if (minutes > 0) return `${minutes}d ${seconds % 60}s`;
    return `${seconds}s`;
  }
  
  function getMainPanelText() {
    const uptime = Date.now() - new Date(config.stats.startTime).getTime();
    const groupCount = Object.keys(config.groups).length;
    const totalSchedules = Object.values(config.groups).reduce((sum, g) => sum + g.schedules.length, 0);
    
    return `🤖 *WhatsApp Otomasyon Kontrol Paneli*\n\n` +
           `📊 *Durum:*\n` +
           `├ WhatsApp: ${config.whatsapp.connected ? '✅ Bağlı' : '❌ Bağlı Değil'}\n` +
           `├ Telegram: ✅ Aktif\n` +
           `├ Çalışma Süresi: ${formatUptime(uptime)}\n` +
           `└ Gönderilen Mesaj: ${config.stats.messagesSent}\n\n` +
           `📋 *İstatistikler:*\n` +
           `├ Toplam Grup: ${groupCount}\n` +
           `└ Toplam Zamanlama: ${totalSchedules}\n\n` +
           `⚙️ *Yönetim:*\n` +
           `Aşağıdaki butonları kullanarak sistemi yönetin.`;
  }
  
  function getGroupListText() {
    const groups = Object.entries(config.groups);
    if (groups.length === 0) {
      return '📋 *Grup Listesi*\n\nHenüz grup eklenmemiş.\n\n➕ Grup eklemek için "Ekle" butonuna basın.';
    }
    
    let text = '📋 *Grup Listesi*\n\n';
    groups.forEach(([id, group], index) => {
      text += `${index + 1}. *${group.name}*\n`;
      text += `   └ ID: \`${id}\`\n`;
      text += `   └ Zamanlama: ${group.schedules.length} adet\n\n`;
    });
    
    return text;
  }
  
  function getGroupDetailText(groupId) {
    const group = config.groups[groupId];
    if (!group) return 'Grup bulunamadı.';
    
    let text = `📱 *${group.name}*\n\n`;
    text += `🆔 ID: \`${groupId}\`\n`;
    text += `⏰ Zamanlama Sayısı: ${group.schedules.length}\n\n`;
    
    if (group.schedules.length > 0) {
      text += `*Zamanlamalar:*\n`;
      group.schedules.forEach((schedule, index) => {
        const preview = schedule.message.substring(0, 30) + (schedule.message.length > 30 ? '...' : '');
        text += `\n${index + 1}. ⏰ ${schedule.time}\n`;
        text += `   └ "${preview}"\n`;
      });
    } else {
      text += '⚠️ Henüz zamanlama eklenmemiş.';
    }
    
    return text;
  }
  
  function getScheduleDetailText(groupId, scheduleIndex) {
    const group = config.groups[groupId];
    if (!group || !group.schedules[scheduleIndex]) return 'Zamanlama bulunamadı.';
    
    const schedule = group.schedules[scheduleIndex];
    return `⏰ *Zamanlama Detayı*\n\n` +
           `📱 Grup: ${group.name}\n` +
           `🕐 Saat: ${schedule.time}\n\n` +
           `📝 *Mesaj:*\n${schedule.message}`;
  }
  
  function getMainKeyboard() {
    return {
      inline_keyboard: [
        [{ text: '👥 Gruplar', callback_data: 'groups' }],
        [{ text: '🔐 Admin', callback_data: 'admin_panel' }],
        [{ text: '🔄 Yenile', callback_data: 'refresh' }]
      ]
    };
  }
  
  function getGroupsKeyboard() {
    const buttons = [];
    Object.entries(config.groups).forEach(([id, group]) => {
      buttons.push([{ text: `📱 ${group.name}`, callback_data: `group_${id}` }]);
    });
    buttons.push([{ text: '➕ Ekle', callback_data: 'add_group' }]);
    buttons.push([{ text: '🔙 Ana Menü', callback_data: 'main' }]);
    return { inline_keyboard: buttons };
  }
  
  function getGroupDetailKeyboard(groupId) {
    return {
      inline_keyboard: [
        [{ text: '⏰ Zamanlamalar', callback_data: `schedules_${groupId}` }],
        [{ text: '🗑️ Grubu Sil', callback_data: `delete_group_${groupId}` }],
        [{ text: '🔙 Grup Listesi', callback_data: 'groups' }]
      ]
    };
  }
  
  function getSchedulesKeyboard(groupId) {
    const group = config.groups[groupId];
    const buttons = [];
    
    if (group && group.schedules.length > 0) {
      group.schedules.forEach((schedule, index) => {
        buttons.push([{ 
          text: `⏰ ${schedule.time} - ${schedule.message.substring(0, 20)}...`, 
          callback_data: `schedule_${groupId}_${index}` 
        }]);
      });
    }
    
    buttons.push([{ text: '➕ Ekle', callback_data: `add_schedule_${groupId}` }]);
    buttons.push([{ text: '🔙 Grup Detay', callback_data: `group_${groupId}` }]);
    return { inline_keyboard: buttons };
  }
  
  function getScheduleDetailKeyboard(groupId, scheduleIndex) {
    return {
      inline_keyboard: [
        [{ text: '✏️ Düzenle', callback_data: `edit_schedule_${groupId}_${scheduleIndex}` }],
        [{ text: '🗑️ Sil', callback_data: `delete_schedule_${groupId}_${scheduleIndex}` }],
        [{ text: '🔙 Zamanlamalar', callback_data: `schedules_${groupId}` }]
      ]
    };
  }
  
  function getAdminKeyboard() {
    return {
      inline_keyboard: [
        [{ text: '🔑 PIN Gir', callback_data: 'admin_login' }],
        [{ text: '🔙 Ana Menü', callback_data: 'main' }]
      ]
    };
  }
  
  function getAdminPanelKeyboard() {
    return {
      inline_keyboard: [
        [{ text: '📟 Console', callback_data: 'console' }],
        [{ text: '⏹️ Botu Kapat', callback_data: 'shutdown' }],
        [{ text: '🔙 Ana Menü', callback_data: 'main' }]
      ]
    };
  }
  
  async function updateAdminPanel(chatId, messageId = null) {
    const text = getMainPanelText();
    const keyboard = getMainKeyboard();
    
    try {
      if (messageId && config.adminMessages.mainPanel) {
        await telegramBot.editMessageText(text, {
          chat_id: chatId,
          message_id: config.adminMessages.mainPanel,
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
      } else {
        const msg = await telegramBot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
        config.adminMessages.mainPanel = msg.message_id;
        saveConfig();
      }
    } catch (e) {
      console.error('Panel güncelleme hatası:', e.message);
    }
  }
  
  whatsappClient.on('qr', (qr) => {
    console.log('\n📱 [WhatsApp] QR Kodu:\n');
    qrcode.generate(qr, { small: true });
    console.log('\n⏳ [WhatsApp] QR taraması bekleniyor...\n');
  });
  
  whatsappClient.on('ready', () => {
    console.log('✅ [WhatsApp] Bağlandı!');
    config.whatsapp.connected = true;
    saveConfig();
    updateAdminPanel(ADMIN_ID);
  });
  
  whatsappClient.on('disconnected', (reason) => {
    console.log(`❌ [WhatsApp] Bağlantı koptu: ${reason}`);
    config.whatsapp.connected = false;
    saveConfig();
  });
  
  whatsappClient.on('message', async (msg) => {
    try {
      const chat = await msg.getChat();
      if (chat.isGroup) {
        const contact = await msg.getContact();
        const preview = msg.body.substring(0, 50) + (msg.body.length > 50 ? '...' : '');
        console.log(`📨 [WhatsApp] ${chat.name} - ${contact.pushname || contact.number}: ${preview}`);
      }
    } catch (e) {}
  });
  
  console.log('🚀 [WhatsApp] Başlatılıyor...');
  whatsappClient.initialize();

  
  // Telegram callback handler
  telegramBot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const data = query.data;
    
    if (!isAdmin(chatId)) {
      await telegramBot.answerCallbackQuery(query.id, { text: '❌ Yetkisiz erişim!' }).catch(() => {});
      return;
    }
    
    try {
      if (data === 'main') {
        await telegramBot.editMessageText(getMainPanelText(), {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: getMainKeyboard()
        });
      }
      else if (data === 'refresh') {
        await updateAdminPanel(chatId, messageId);
        await telegramBot.answerCallbackQuery(query.id, { text: '✅ Yenilendi!' }).catch(() => {});
        return;
      }
      else if (data === 'groups') {
        await telegramBot.editMessageText(getGroupListText(), {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: getGroupsKeyboard()
        });
      }
      else if (data === 'add_group') {
        userStates[chatId] = { action: 'add_group_id' };
        await telegramBot.sendMessage(chatId, '📝 Grup ID\'sini girin:\n\nÖrnek: 1234567890@g.us');
        await telegramBot.answerCallbackQuery(query.id).catch(() => {});
        return;
      }
      else if (data.startsWith('group_')) {
        const groupId = data.replace('group_', '');
        await telegramBot.editMessageText(getGroupDetailText(groupId), {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: getGroupDetailKeyboard(groupId)
        });
      }
      else if (data.startsWith('delete_group_')) {
        const groupId = data.replace('delete_group_', '');
        const groupName = config.groups[groupId]?.name || 'Bilinmeyen';
        delete config.groups[groupId];
        saveConfig();
        await telegramBot.editMessageText(getGroupListText(), {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: getGroupsKeyboard()
        });
        await telegramBot.answerCallbackQuery(query.id, { text: `✅ ${groupName} silindi!` }).catch(() => {});
        return;
      }
      else if (data.startsWith('schedules_')) {
        const groupId = data.replace('schedules_', '');
        const group = config.groups[groupId];
        let text = `⏰ *${group.name} - Zamanlamalar*\n\n`;
        
        if (group.schedules.length === 0) {
          text += 'Henüz zamanlama eklenmemiş.';
        } else {
          group.schedules.forEach((schedule, index) => {
            const preview = schedule.message.substring(0, 30) + (schedule.message.length > 30 ? '...' : '');
            text += `${index + 1}. ⏰ ${schedule.time}\n   └ "${preview}"\n\n`;
          });
        }
        
        await telegramBot.editMessageText(text, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: getSchedulesKeyboard(groupId)
        });
      }
      else if (data.startsWith('add_schedule_')) {
        const groupId = data.replace('add_schedule_', '');
        userStates[chatId] = { action: 'add_schedule_time', groupId };
        await telegramBot.sendMessage(chatId, '🕐 Saat girin (HH:MM formatında):\n\nÖrnek: 09:30');
        await telegramBot.answerCallbackQuery(query.id).catch(() => {});
        return;
      }
      else if (data.startsWith('schedule_') && !data.includes('add_') && !data.includes('edit_') && !data.includes('delete_')) {
        const parts = data.replace('schedule_', '').split('_');
        const groupId = parts[0];
        const scheduleIndex = parseInt(parts[1]);
        
        await telegramBot.editMessageText(getScheduleDetailText(groupId, scheduleIndex), {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: getScheduleDetailKeyboard(groupId, scheduleIndex)
        });
      }
      else if (data.startsWith('edit_schedule_')) {
        const parts = data.replace('edit_schedule_', '').split('_');
        const groupId = parts[0];
        const scheduleIndex = parseInt(parts[1]);
        userStates[chatId] = { action: 'edit_schedule_time', groupId, scheduleIndex };
        await telegramBot.sendMessage(chatId, '🕐 Yeni saat girin (HH:MM):\n\nÖrnek: 14:30');
        await telegramBot.answerCallbackQuery(query.id).catch(() => {});
        return;
      }
      else if (data.startsWith('delete_schedule_')) {
        const parts = data.replace('delete_schedule_', '').split('_');
        const groupId = parts[0];
        const scheduleIndex = parseInt(parts[1]);
        
        config.groups[groupId].schedules.splice(scheduleIndex, 1);
        saveConfig();
        
        const group = config.groups[groupId];
        let text = `⏰ *${group.name} - Zamanlamalar*\n\n`;
        
        if (group.schedules.length === 0) {
          text += 'Henüz zamanlama eklenmemiş.';
        } else {
          group.schedules.forEach((schedule, index) => {
            const preview = schedule.message.substring(0, 30) + (schedule.message.length > 30 ? '...' : '');
            text += `${index + 1}. ⏰ ${schedule.time}\n   └ "${preview}"\n\n`;
          });
        }
        
        await telegramBot.editMessageText(text, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: getSchedulesKeyboard(groupId)
        });
        await telegramBot.answerCallbackQuery(query.id, { text: '✅ Zamanlama silindi!' }).catch(() => {});
        return;
      }
      else if (data === 'admin_panel') {
        if (checkAdminSession(chatId)) {
          await telegramBot.editMessageText('🔐 *Admin Panel*\n\nYönetim araçlarına erişebilirsiniz.', {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            reply_markup: getAdminPanelKeyboard()
          });
        } else {
          await telegramBot.editMessageText('🔐 *Admin Panel*\n\nErişim için PIN kodu gerekli.', {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            reply_markup: getAdminKeyboard()
          });
        }
      }
      else if (data === 'admin_login') {
        userStates[chatId] = { action: 'admin_pin' };
        await telegramBot.sendMessage(chatId, '🔑 Admin PIN kodunu girin:');
        await telegramBot.answerCallbackQuery(query.id).catch(() => {});
        return;
      }
      else if (data === 'console') {
        if (!checkAdminSession(chatId)) {
          await telegramBot.answerCallbackQuery(query.id, { text: '❌ Oturum süresi doldu!' }).catch(() => {});
          await telegramBot.editMessageText('🔐 *Admin Panel*\n\nOturum süresi doldu. Tekrar giriş yapın.', {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            reply_markup: getAdminKeyboard()
          });
          return;
        }
        
        let consoleText = '📟 *Console Logları*\n\n';
        if (consoleBuffer.length === 0) {
          consoleText += 'Henüz log kaydı yok.';
        } else {
          const recentLogs = consoleBuffer.slice(-20);
          recentLogs.forEach(log => {
            const time = new Date(log.time).toLocaleTimeString('tr-TR');
            const icon = log.type === 'error' ? '❌' : '📝';
            consoleText += `${icon} [${time}] ${log.message}\n`;
          });
        }
        
        await telegramBot.editMessageText(consoleText, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔄 Yenile', callback_data: 'console' }],
              [{ text: '🔙 Admin Panel', callback_data: 'admin_panel' }]
            ]
          }
        });
      }
      else if (data === 'shutdown') {
        if (!checkAdminSession(chatId)) {
          await telegramBot.answerCallbackQuery(query.id, { text: '❌ Oturum süresi doldu!' }).catch(() => {});
          return;
        }
        
        await telegramBot.editMessageText('⏹️ *Bot Kapatılıyor*\n\nSistem güvenli şekilde kapatılıyor...', {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown'
        });
        
        console.log('⏹️  [Sistem] Admin tarafından kapatıldı');
        saveConfig();
        await whatsappClient.destroy();
        await telegramBot.stopPolling();
        process.exit(0);
      }
      
      await telegramBot.answerCallbackQuery(query.id).catch(() => {});
      
    } catch (e) {
      console.error('Callback hatası:', e.message);
      await telegramBot.answerCallbackQuery(query.id, { text: '❌ Bir hata oluştu!' }).catch(() => {});
    }
  });
  
  // Telegram message handler
  telegramBot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    
    if (!isAdmin(chatId)) return;
    if (!text || text.startsWith('/')) return;
    
    const state = userStates[chatId];
    if (!state) return;
    
    try {
      if (state.action === 'add_group_id') {
        if (!text.includes('@g.us')) {
          await telegramBot.sendMessage(chatId, '❌ Geçersiz format! Grup ID\'si @g.us ile bitmelidir.\n\nÖrnek: 1234567890@g.us');
          return;
        }
        userStates[chatId] = { action: 'add_group_name', groupId: text.trim() };
        await telegramBot.sendMessage(chatId, '📝 Grup ismini girin:');
      }
      else if (state.action === 'add_group_name') {
        config.groups[state.groupId] = {
          name: text.trim(),
          schedules: []
        };
        saveConfig();
        delete userStates[chatId];
        await telegramBot.sendMessage(chatId, `✅ Grup eklendi: ${text.trim()}`);
        updateAdminPanel(chatId);
      }
      else if (state.action === 'add_schedule_time') {
        const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
        if (!timeRegex.test(text.trim())) {
          await telegramBot.sendMessage(chatId, '❌ Geçersiz format! HH:MM formatında girin.\n\nÖrnek: 09:30');
          return;
        }
        userStates[chatId] = { action: 'add_schedule_message', groupId: state.groupId, time: text.trim() };
        await telegramBot.sendMessage(chatId, '📝 Mesajı girin:');
      }
      else if (state.action === 'add_schedule_message') {
        config.groups[state.groupId].schedules.push({
          time: state.time,
          message: text
        });
        saveConfig();
        delete userStates[chatId];
        await telegramBot.sendMessage(chatId, `✅ Zamanlama eklendi!\n\n⏰ Saat: ${state.time}\n📝 Mesaj: ${text.substring(0, 50)}...`);
        updateAdminPanel(chatId);
      }
      else if (state.action === 'edit_schedule_time') {
        const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
        if (!timeRegex.test(text.trim())) {
          await telegramBot.sendMessage(chatId, '❌ Geçersiz format! HH:MM formatında girin.\n\nÖrnek: 14:30');
          return;
        }
        userStates[chatId] = { 
          action: 'edit_schedule_message', 
          groupId: state.groupId, 
          scheduleIndex: state.scheduleIndex,
          time: text.trim() 
        };
        await telegramBot.sendMessage(chatId, '📝 Yeni mesajı girin:');
      }
      else if (state.action === 'edit_schedule_message') {
        config.groups[state.groupId].schedules[state.scheduleIndex] = {
          time: state.time,
          message: text
        };
        saveConfig();
        delete userStates[chatId];
        await telegramBot.sendMessage(chatId, `✅ Zamanlama güncellendi!\n\n⏰ Saat: ${state.time}\n📝 Mesaj: ${text.substring(0, 50)}...`);
        updateAdminPanel(chatId);
      }
      else if (state.action === 'admin_pin') {
        if (text.trim() === ADMIN_PIN) {
          createAdminSession(chatId);
          delete userStates[chatId];
          await telegramBot.sendMessage(chatId, '✅ Giriş başarılı! Admin paneline erişebilirsiniz.\n\n⏱️ Oturum süresi: 30 dakika');
          updateAdminPanel(chatId);
        } else {
          await telegramBot.sendMessage(chatId, '❌ Hatalı PIN kodu!');
          delete userStates[chatId];
        }
      }
      
    } catch (e) {
      console.error('Mesaj işleme hatası:', e.message);
      await telegramBot.sendMessage(chatId, '❌ Bir hata oluştu!');
      delete userStates[chatId];
    }
  });
  
  // Cron job
  cron.schedule('* * * * *', async () => {
    if (!config.whatsapp.connected) return;
    
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    for (const [groupId, group] of Object.entries(config.groups)) {
      for (const schedule of group.schedules) {
        if (schedule.time === currentTime) {
          try {
            await new Promise(resolve => setTimeout(resolve, 10000));
            await whatsappClient.sendMessage(groupId, schedule.message);
            config.stats.messagesSent++;
            saveConfig();
            console.log(`✅ [Mesaj] ${group.name} - ${schedule.time}`);
          } catch (e) {
            console.error(`❌ [Mesaj Hatası] ${group.name}: ${e.message}`);
          }
        }
      }
    }
  });
  
  console.log('🤖 [Telegram] Bot başlatıldı!');
  console.log(`👤 [Admin] ID: ${ADMIN_ID}`);
  console.log('✅ [Sistem] Aktif\n');
  
  setTimeout(() => {
    console.log('📤 [Telegram] Admin paneli gönderiliyor...');
    updateAdminPanel(ADMIN_ID);
  }, 3000);
  
  process.on('SIGINT', async () => {
    console.log('\n\n⏹️  [Sistem] Kapatılıyor...');
    saveConfig();
    await whatsappClient.destroy();
    await telegramBot.stopPolling();
    console.log('👋 [Sistem] Kapatıldı\n');
    process.exit(0);
  });
}

// === OTOMATİK YENİDEN BAŞLATMA ===
const RESTART_DELAY = 5000;

function autoRestart() {
  console.log(`${colors.yellow}🔄 [Sistem] Yeniden başlatılıyor...${colors.reset}`);
  console.log(`${colors.cyan}⏳ [Sistem] ${RESTART_DELAY / 1000} saniye bekleniyor...${colors.reset}\n`);
  
  setTimeout(() => {
    const { spawn } = require('child_process');
    const child = spawn(process.argv[0], process.argv.slice(1), {
      detached: true,
      stdio: 'inherit',
      env: { ...process.env, AUTO_RESTART: 'true' }
    });
    child.unref();
    process.exit(0);
  }, RESTART_DELAY);
}

process.on('uncaughtException', (error) => {
  console.error(`${colors.red}❌ [Hata] Yakalanmamış hata: ${error.message}${colors.reset}`);
  console.error(error.stack);
  autoRestart();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(`${colors.red}❌ [Hata] İşlenmeyen Promise reddi:${colors.reset}`, reason);
  autoRestart();
});

// === BAŞLATMA ===
showLoginScreen();
