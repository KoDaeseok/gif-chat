const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const {
  renderMain, renderRoom, createRoom, enterRoom, removeRoom, sendChat, sendGif,
} = require('../controllers');
const Chat = require('../schemas/chat');

const router = express.Router();

// uploads 디렉토리 절대 경로 설정
const uploadsDir = path.join(__dirname, '..', 'uploads');
console.log('Multer uploads 디렉토리:', uploadsDir);

// uploads 디렉토리 확인 및 생성
try {
    fs.accessSync(uploadsDir);
} catch (error) {
    console.log('uploads 디렉토리 생성');
    fs.mkdirSync(uploadsDir);
}

const upload = multer({
    storage: multer.diskStorage({
        destination(req, file, done) {
            done(null, uploadsDir);
        },
        filename(req, file, done) {
            const ext = path.extname(file.originalname);
            const basename = path.basename(file.originalname, ext);
            const filename = basename + Date.now() + ext;
            done(null, filename);
        },
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

router.get('/', renderMain);

router.get('/room', renderRoom);

router.post('/room', createRoom);

router.get('/room/:id', enterRoom);

router.delete('/room/:id', removeRoom);

router.post('/room/:id/chat', sendChat);

router.post('/room/:id/gif', upload.single('gif'), sendGif);

module.exports = router;
