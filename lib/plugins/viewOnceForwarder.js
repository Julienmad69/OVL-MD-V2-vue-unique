// viewOnceForwarder.js
// Plugin pour OVL-MD-V2 : transfert automatique des messages "vue unique" que vous vous envoyez
// vers votre numéro principal (défini dans NUMERO_OWNER)

const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');

module.exports = {
    name: 'viewOnceForwarder',
    async execute(conn, message, args) {
        try {
            // 1. Vérifier que le message contient un contenu média
            const msg = message.message;
            if (!msg) return;

            // Types de médias possibles dans un message view-once
            const mediaTypes = ['imageMessage', 'videoMessage', 'audioMessage'];
            const type = Object.keys(msg)[0];
            if (!mediaTypes.includes(type)) return;

            const media = msg[type];

            // 2. Vérifier que c'est bien un message à visualisation unique
            if (!media.viewOnce) return;

            // 3. Vérifier que le message a été envoyé par VOUS-MÊME (depuis votre autre téléphone)
            if (!message.key.fromMe) return;

            console.log('📸 Message view-once de vous-même détecté. Téléchargement...');

            // 4. Télécharger le contenu du média
            const stream = await downloadContentFromMessage(media, type.replace('Message', ''));
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            // 5. Déterminer le type MIME
            let mimeType, captionType;
            if (type === 'imageMessage') {
                mimeType = 'image/jpeg';
                captionType = '🖼️ Image';
            } else if (type === 'videoMessage') {
                mimeType = 'video/mp4';
                captionType = '🎥 Vidéo';
            } else if (type === 'audioMessage') {
                mimeType = 'audio/mpeg';
                captionType = '🎵 Audio';
            }

            // 6. Construire le JID du propriétaire
            const ownerJid = process.env.NUMERO_OWNER + '@s.whatsapp.net';

            // 7. Envoyer le média directement à votre numéro principal
            await conn.sendMessage(ownerJid, {
                [type.replace('Message', '')]: buffer,
                mimetype: mimeType,
                caption: `${captionType} view-once reçue le ${new Date().toLocaleString()}`
            });

            console.log(`✅ Média view-once transféré avec succès à ${ownerJid}`);

        } catch (error) {
            console.error('❌ Erreur dans viewOnceForwarder :', error);
        }
    }
};
