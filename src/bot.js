const { VK } = require('vk-io');
const imgGen = require('./imgGen');

const groupKey = 'd3c461608ce733b027c2059ba90ec362100beabe5c54538226a8f77fa8129a7e36da0bfdb9ebd39d5600c';
const serviceKey = '6418e9086418e9086418e90823646ac185664186418e9083ad2b7222f565c3b34c6afa2';
const owner_id = -195666532;
let cover;

const vk = new VK({
  token: groupKey,
});
const vkService = new VK({
  token: serviceKey,
});

const uploadServer = async (img) => {
  await vk.upload.groupCover({
    group_id: 195666532,
    source: img,
    crop_x2: 1600,
    crop_y2: 800,
  });
};
const commentsCountGlobal = [];

const generateCover = async (users) => {
  const photos = [];
  const place = [{ x: 853, y: 165 }, { x: 1040, y: 165 }, { x: 1220, y: 165 }];
  users.forEach((item, i) => {
    photos.push({
      photo: item.photo_100,
      text: `${item.first_name}\n${item.last_name}`,
      x: place[i].x,
      y: place[i].y,
    });
  });
  const img = await imgGen(`${__dirname}/covers/${cover}.png`, photos);
  await uploadServer(img);
};

const getWinners = async () => {
  const winners = commentsCountGlobal
    .sort((a, b) => b.count - a.count)
    .slice(0, 2);
  const users = await vk.api.users.get({
    user_ids: winners.map((item) => `${item.from_id},`),
    fields: 'photo_100',
  });
  await generateCover(users);
};
const changeCover = (commentsCount) => {
  if (commentsCount < 15) cover = 1;
  else if (commentsCount < 30) cover = 2;
  else cover = 3;
};
const replyId = async (context) => {
  const post_id = context.objectId;
  const comments = await vkService.api.wall.getComments({
    owner_id,
    post_id,
    count: 100,
  });
  const parentComment = comments.items.find((item) => item.id === context.replyId);
  if (parentComment.text !== '#GLUTENFREEDIET') return;
  const { count } = parentComment.thread;
  if (count % 5 === 0) {
    await vk.api.wall.createComment({
      owner_id,
      post_id,
      reply_to_comment: context.replyId,
      message: `Ты красавчик, уже ${count} раз ты помог нам зарядить луч`,
    });
  }
};
vk.updates.on('comment', async (context) => {
  if (!context.fromId || context.fromId === owner_id) return;
  if (context.isReply) await replyId(context);
  const comments = await vkService.api.wall.getComments({
    owner_id,
    post_id: context.objectId,
    extended: 1,
    count: 100,
  });
  let countComment = 0;
  countComment += comments.items.filter((item) => item.from_id === context.fromId).length;
  for (const item of comments.items) {
    const comment = await vkService.api.wall.getComments({
      owner_id,
      post_id: context.objectId,
      comment_id: item.id,
    });
    const { items } = comment;
    const replyComments = items.filter(
      (commentItem) => commentItem.from_id === context.fromId,
    ).length;
    countComment += replyComments;
  }
  const comment = commentsCountGlobal.find((item) => item.from_id === context.fromId);
  if (comment) {
    comment.count = countComment;
  } else {
    commentsCountGlobal.push({
      from_id: context.fromId,
      count: countComment,
    });
  }
  changeCover(comments.count);
  await getWinners();
});

vk.updates.start().catch(console.log);
