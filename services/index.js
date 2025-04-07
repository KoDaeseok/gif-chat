const Room = require('../schemas/room');
const Chat = require('../schemas/chat');

exports.removeRoom = async (roomId) => {
  try {
    // 방을 삭제하지 않고 상태만 변경
    await Room.findByIdAndUpdate(roomId, {
      $set: {
        deleted: true,
        deletedAt: new Date()
      }
    });
    // 채팅은 삭제하지 않음
  } catch (error) {
    throw error;
  }
};
