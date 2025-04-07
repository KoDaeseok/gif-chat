const Room = require('../schemas/room');
const Chat = require('../schemas/chat');
const { removeRoom: removeRoomService } = require('../services'); 

exports.renderMain = async (req, res, next) => {
  try {
    const rooms = await Room.find({});
    res.render('main', { rooms, title: 'GIF 채팅방' });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

exports.renderRoom = (req, res) => {
  res.render('room', { title: 'GIF 채팅방 생성' });
};

exports.createRoom = async (req, res, next) => {
  try {
    console.log('방 생성 요청 데이터:', {
      title: req.body.title,
      max: req.body.max,
      owner: req.body.owner,
      password: req.body.password,
    });
    
    if (!req.body.title || !req.body.owner) {
      throw new Error('방 제목과 방장 이름은 필수 입력값입니다.');
    }

    const newRoom = await Room.create({
      title: req.body.title,
      max: req.body.max,
      owner: req.body.owner,
      password: req.body.password,
    });
    
    console.log('생성된 방 정보:', newRoom);
    
    const io = req.app.get('io');
    io.of('/room').emit('newRoom', newRoom);
    
    req.session.color = req.body.owner;
    
    if (req.body.password) { // 비밀번호가 있는 방이면
      res.redirect(`/room/${newRoom._id}?password=${req.body.password}&username=${encodeURIComponent(req.body.owner)}`);
    } else {
      res.redirect(`/room/${newRoom._id}?username=${encodeURIComponent(req.body.owner)}`);
    }
  } catch (error) {
    console.error('방 생성 오류:', error);
    return res.redirect('/room?error=' + encodeURIComponent(error.message));
  }
};

exports.enterRoom = async (req, res, next) => {
  try {
    const room = await Room.findOne({ 
      _id: req.params.id,
      deleted: { $ne: true }
    });
    if (!room) {
      return res.redirect('/?error=존재하지 않는 방입니다.');
    }
    if (room.password && room.password !== req.query.password) {
      return res.redirect('/?error=비밀번호가 틀렸습니다.');
    }
    if (!req.query.username || req.query.username.trim().length === 0) {
      return res.redirect('/?error=사용자 이름이 필요합니다.');
    }
    const io = req.app.get('io');
    const { rooms } = io.of('/chat').adapter;
    if (room.max <= rooms.get(req.params.id)?.size) {
      return res.redirect('/?error=허용 인원이 초과하였습니다.');
    }
    // 사용자 이름을 세션에 저장
    req.session.color = req.query.username;
    const chats = await Chat.find({ room: room._id }).sort('createdAt');
    return res.render('chat', {
      room,
      title: room.title,
      chats,
      user: req.session.color,
    });
  } catch (error) {
    console.error(error);
    return next(error);
  }
};

exports.removeRoom = async (req, res, next) => {
  try {
    await removeRoomService(req.params.id);
    res.send('ok');
  } catch (error) {
    console.error(error);
    next(error);
  }
};

exports.sendChat = async (req, res, next) => {
  try {
    const chat = await Chat.create({
      room: req.params.id,
      user: req.session.color,
      chat: req.body.chat,
    });
    req.app.get('io').of('/chat').to(req.params.id).emit('chat', chat);
    res.send('ok');
  } catch (error) {
    console.error(error);
    next(error);
  }
};

exports.sendGif = async (req, res, next) => {
  try {
    const chat = await Chat.create({
      room: req.params.id,
      user: req.session.color,
      gif: req.file.filename,
    });
    req.app.get('io').of('/chat').to(req.params.id).emit('chat', chat);
    res.send('ok');
  } catch (error) {
    console.error(error);
    next(error);
  }
};
